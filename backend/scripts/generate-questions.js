/**
 * 本地运行脚本：生成题目
 *
 * 使用方法：
 * 1. 在 backend 目录下运行
 * 2. node scripts/generate-questions.js [数量]
 *
 * 示例：
 *   node scripts/generate-questions.js 3
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// 初始化 Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 下载图片并上传到 Supabase Storage
async function uploadImageToSupabase(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        uploadImageToSupabase(response.headers.location).then(resolve).catch(reject);
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
          const fileName = `questions/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          const { error } = await supabase.storage
            .from('images')
            .upload(fileName, buffer, {
              contentType: 'image/png',
              cacheControl: '31536000'
            });

          if (error) {
            reject(new Error(`Failed to upload: ${error.message}`));
            return;
          }

          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          resolve(urlData.publicUrl);
        } catch (err) {
          reject(err);
        }
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// 调用 Coze API 生成一道题
function generateOneQuestion() {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.COZE_API_KEY;
    const workflowId = process.env.COZE_WORKFLOW_ID;

    if (!apiKey || !workflowId) {
      reject(new Error('Missing COZE_API_KEY or COZE_WORKFLOW_ID'));
      return;
    }

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
      timeout: 120000 // 2 分钟超时
    };

    console.log('  调用 Coze API...');

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

// 主函数
async function main() {
  const count = parseInt(process.argv[2]) || 1;

  console.log(`\n========================================`);
  console.log(`  开始生成 ${count} 道题目`);
  console.log(`========================================\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    console.log(`[${i + 1}/${count}] 生成中...`);

    try {
      // 1. 调用 Coze 生成题目
      const question = await generateOneQuestion();

      if (!question) {
        console.log(`  ❌ 生成失败：返回空结果\n`);
        failed++;
        continue;
      }

      console.log(`  ✓ 答案: ${question.answer}`);

      // 2. 转存图片到 Supabase Storage
      console.log(`  上传图片到 Supabase...`);
      let finalUrl = question.image_url;

      try {
        finalUrl = await uploadImageToSupabase(question.image_url);
        console.log(`  ✓ 图片已上传`);
      } catch (uploadErr) {
        console.log(`  ⚠ 图片上传失败，使用原始链接: ${uploadErr.message}`);
      }

      // 3. 保存到数据库
      const { error } = await supabase
        .from('questions')
        .upsert(
          { image_url: finalUrl, answer: question.answer, created_at: new Date().toISOString() },
          { onConflict: 'answer', ignoreDuplicates: true }
        );

      if (error) {
        console.log(`  ❌ 保存失败: ${error.message}\n`);
        failed++;
      } else {
        console.log(`  ✓ 已保存到数据库\n`);
        success++;
      }

      // 间隔 2 秒
      if (i < count - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (err) {
      console.log(`  ❌ 错误: ${err.message}\n`);
      failed++;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`========================================`);
  console.log(`  完成！成功: ${success}, 失败: ${failed}`);
  console.log(`========================================\n`);
}

main().catch(console.error);
