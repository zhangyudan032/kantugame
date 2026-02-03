const express = require('express');
const supabase = require('../config/supabase');
const adminMiddleware = require('../middleware/admin');
const { generateQuestions, saveQuestions } = require('../services/coze');

const router = express.Router();

router.get('/health', adminMiddleware, async (req, res) => {
  try {
    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: answerCount } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true });

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      counts: {
        questions: questionCount || 0,
        users: userCount || 0,
        answers: answerCount || 0
      },
      server: {
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Admin health error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/generate', adminMiddleware, async (req, res) => {
  try {
    const requested = Number(req.body?.count) || 5;
    const count = Math.max(1, Math.min(20, Math.floor(requested)));
    const newQuestions = await generateQuestions(count);
    const saved = newQuestions.length ? await saveQuestions(supabase, newQuestions) : 0;

    res.json({
      ok: true,
      requested: count,
      generated: newQuestions.length,
      saved
    });
  } catch (error) {
    console.error('Admin generate error:', error);
    res.status(500).json({ error: '生成题目失败' });
  }
});

module.exports = router;
