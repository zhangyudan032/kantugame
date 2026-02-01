const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { getBeijingTime } = require('../utils/time');

const router = express.Router();

// POST /api/auth/register - 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, password: hashedPassword, created_at: getBeijingTime() })
      .select('id, email, created_at')
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: '注册失败' });
    }

    // Set session
    req.session.userId = newUser.id;
    req.session.email = newUser.email;

    res.json({
      message: '注册成功',
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/auth/login - 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在', code: 'USER_NOT_FOUND' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误', code: 'INVALID_PASSWORD' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
      message: '登录成功',
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /api/auth/logout - 退出
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get statistics
    const { data: answers } = await supabase
      .from('user_answers')
      .select('is_correct')
      .eq('user_id', userId);

    const totalAnswered = answers?.length || 0;
    const correctCount = answers?.filter(a => a.is_correct).length || 0;
    const accuracy = totalAnswered > 0
      ? Math.round((correctCount / totalAnswered) * 100)
      : 0;

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });

    res.json({
      message: '已退出',
      statistics: {
        totalAnswered,
        correctCount,
        wrongCount: totalAnswered - correctCount,
        accuracy: `${accuracy}%`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
