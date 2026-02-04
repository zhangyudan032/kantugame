const https = require('https');
const http = require('http');
const { getBeijingTime } = require('../utils/time');

// 下载图片并上传到 Supabase Storage
async function uploadImageToSupabase(supabase, imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, (response) => {
      // 处理重定向
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        uploadImageToSupabase(supabase, response.headers.location)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);

          // 生成唯一文件名
          const fileName = `questions/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          // 上传到 Supabase Storage
          const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, buffer, {
              contentType: 'image/png',
              cacheControl: '31536000'
            });

          if (error) {
            reject(new Error(`Failed to upload to Supabase: ${error.message}`));
            return;
          }

          // 获取公开 URL
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

          resolve(urlData.publicUrl);
        } catch (err) {
          reject(err);
        }
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// 调用一次工作流，生成一道题
function generateOneQuestion() {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.COZE_API_KEY;
    const workflowId = process.env.COZE_WORKFLOW_ID;

    const data = JSON.stringify({
      workflow_id: workflowId,
      parameters: { input: '开始' }
    });

    const options = {
      hostname: 'api.coze.cn',
      port: 443,
      path: '/v1/workflow/run',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);

          if (result.code !== 0) {
            reject(new Error(result.msg || `API error: ${result.code}`));
            return;
          }

          // 解析结果 - 格式: { output: "图片URL", output2: "答案" }
          let responseData = result.data;
          if (typeof responseData === 'string') {
            responseData = JSON.parse(responseData);
          }

          if (responseData.output && responseData.output2) {
            resolve({
              image_url: responseData.output,
              answer: responseData.output2
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

// 生成多道题（调用多次工作流）
async function generateQuestions(count = 5) {
  const apiKey = process.env.COZE_API_KEY;
  const workflowId = process.env.COZE_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    console.error('Missing Coze API configuration');
    return [];
  }

  console.log(`Generating ${count} questions from Coze...`);
  const questions = [];

  for (let i = 0; i < count; i++) {
    try {
      console.log(`Generating question ${i + 1}/${count}...`);
      const question = await generateOneQuestion();

      if (question) {
        questions.push(question);
        console.log(`Question ${i + 1}: ${question.answer}`);
      }

      // 间隔 1 秒避免请求过快
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}:`, error.message);
      // 失败后等待 2 秒再继续
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`Successfully generated ${questions.length} questions`);
  return questions;
}

async function saveQuestions(supabase, questions) {
  let savedCount = 0;
  for (const q of questions) {
    if (q.image_url && q.answer) {
      try {
        // 将临时图片转存到 Supabase Storage
        console.log(`Uploading image for "${q.answer}" to Supabase Storage...`);
        const permanentUrl = await uploadImageToSupabase(supabase, q.image_url);
        console.log(`Image uploaded: ${permanentUrl}`);

        const { error } = await supabase
          .from('questions')
          .upsert(
            { image_url: permanentUrl, answer: q.answer, created_at: getBeijingTime() },
            { onConflict: 'answer', ignoreDuplicates: true }
          );
        if (!error) {
          savedCount++;
        } else {
          console.error('Failed to insert question:', error.message);
        }
      } catch (uploadError) {
        console.error(`Failed to upload image for "${q.answer}":`, uploadError.message);
        // 如果转存失败，尝试使用原始 URL（可能仍然有问题）
        const { error } = await supabase
          .from('questions')
          .upsert(
            { image_url: q.image_url, answer: q.answer, created_at: getBeijingTime() },
            { onConflict: 'answer', ignoreDuplicates: true }
          );
        if (!error) {
          savedCount++;
        }
      }
    }
  }
  return savedCount;
}

// 检查并自动生成题目（异步执行，不阻塞请求）
async function checkAndGenerateQuestions(supabase, userId) {
  try {
    // 统计用户剩余未答题目数
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    const { count: answeredQuestions } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const remainingQuestions = (totalQuestions || 0) - (answeredQuestions || 0);
    console.log(`[Coze] Total: ${totalQuestions}, Answered: ${answeredQuestions}, Remaining: ${remainingQuestions}`);

    // 剩余题目 <= 5 时触发生成
    if (remainingQuestions <= 5) {
      console.log(`User ${userId} has ${remainingQuestions} remaining questions, generating more...`);

      const newQuestions = await generateQuestions(5);

      if (newQuestions.length > 0) {
        const savedCount = await saveQuestions(supabase, newQuestions);
        console.log(`Saved ${savedCount} new questions to database`);
      }
    }
  } catch (error) {
    console.error('Error in checkAndGenerateQuestions:', error.message);
  }
}

module.exports = {
  generateOneQuestion,
  generateQuestions,
  saveQuestions,
  checkAndGenerateQuestions
};
