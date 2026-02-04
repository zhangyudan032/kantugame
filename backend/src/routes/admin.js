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
    const message = process.env.NODE_ENV === 'production'
      ? 'Server error'
      : (error?.message || 'Server error');
    res.status(500).json({ error: message });
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
    const message = process.env.NODE_ENV === 'production'
      ? 'Generate failed'
      : (error?.message || 'Generate failed');
    res.status(500).json({ error: message });
  }
});

module.exports = router;
