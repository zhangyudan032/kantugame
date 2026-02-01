const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { checkAndGenerateQuestions } = require('../services/coze');

const router = express.Router();

// GET /api/questions/next - 获取下一题
router.get('/next', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Getting question for user:', userId);

    // Trigger background question generation if needed
    checkAndGenerateQuestions(supabase, userId);

    // Get IDs of questions the user has already answered
    const { data: answeredQuestions } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', userId);

    const answeredIds = answeredQuestions?.map(a => a.question_id) || [];

    // 如果 session 中有当前题目且未回答，继续返回该题目
    if (req.session.currentQuestionId && !answeredIds.includes(req.session.currentQuestionId)) {
      const { data: currentQ } = await supabase
        .from('questions')
        .select('id, image_url')
        .eq('id', req.session.currentQuestionId)
        .single();

      if (currentQ) {
        console.log('Returning current question:', currentQ.id);
        return res.json({
          id: currentQ.id,
          imageUrl: currentQ.image_url
        });
      }
    }

    // Get a random unanswered question
    let query = supabase
      .from('questions')
      .select('id, image_url, created_at');

    if (answeredIds.length > 0) {
      query = query.not('id', 'in', `(${answeredIds.join(',')})`);
    }

    const { data: questions, error } = await query.limit(10);

    if (error) {
      console.error('Get question error:', error);
      return res.status(500).json({ error: '获取题目失败' });
    }

    if (!questions || questions.length === 0) {
      req.session.currentQuestionId = null;
      return res.json({ code: 'NO_QUESTION' });
    }

    // Pick a random one from the fetched questions
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];

    // 保存当前题目到 session
    req.session.currentQuestionId = question.id;

    res.json({
      id: question.id,
      imageUrl: question.image_url
    });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
