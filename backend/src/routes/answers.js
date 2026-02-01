const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/answers/submit - 提交答案
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({ error: '题目ID和答案不能为空' });
    }

    // Get the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, answer')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return res.status(404).json({ error: '题目不存在' });
    }

    // Check if already answered
    const { data: existingAnswer } = await supabase
      .from('user_answers')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (existingAnswer) {
      return res.status(400).json({ error: '该题目已经回答过' });
    }

    // Check if answer is correct (case-insensitive, trim whitespace)
    const isCorrect = answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    // Record the answer
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert({
        user_id: userId,
        question_id: questionId,
        is_correct: isCorrect
      });

    if (insertError) {
      console.error('Insert answer error:', insertError);
      return res.status(500).json({ error: '提交答案失败' });
    }

    res.json({
      isCorrect: isCorrect,
      correctAnswer: question.answer
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
