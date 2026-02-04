const express = require('express');
const supabase = require('../config/supabase');
const adminMiddleware = require('../middleware/admin');
const { generateQuestions, saveQuestions, migrateImagesToStorage } = require('../services/coze');

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

    // 统计需要迁移的图片数量
    const { count: pendingMigration } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'like', '%supabase%');

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      counts: {
        questions: questionCount || 0,
        users: userCount || 0,
        answers: answerCount || 0,
        pendingImageMigration: pendingMigration || 0
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

// 生成题目（默认1道，避免超时）
router.post('/generate', adminMiddleware, async (req, res) => {
  try {
    const requested = Number(req.body?.count) || 1;
    const count = Math.max(1, Math.min(3, Math.floor(requested))); // 最多3道

    console.log(`Admin generating ${count} question(s)...`);
    const newQuestions = await generateQuestions(count);
    const saved = newQuestions.length ? await saveQuestions(supabase, newQuestions) : 0;

    res.json({
      ok: true,
      requested: count,
      generated: newQuestions.length,
      saved,
      message: saved > 0 ? '题目已保存，图片将在后台自动转存' : '生成失败'
    });
  } catch (error) {
    console.error('Admin generate error:', error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Generate failed'
      : (error?.message || 'Generate failed');
    res.status(500).json({ error: message });
  }
});

// 手动触发图片迁移
router.post('/migrate-images', adminMiddleware, async (req, res) => {
  try {
    console.log('Admin triggered image migration...');
    const result = await migrateImagesToStorage(supabase);
    res.json({
      ok: true,
      ...result,
      message: result.migrated > 0
        ? `成功迁移 ${result.migrated} 张图片`
        : '没有需要迁移的图片'
    });
  } catch (error) {
    console.error('Admin migrate error:', error);
    res.status(500).json({ error: error.message || 'Migration failed' });
  }
});

module.exports = router;
