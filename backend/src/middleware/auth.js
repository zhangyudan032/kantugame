function authMiddleware(req, res, next) {
  console.log('Auth check - Session:', req.session?.userId || 'none');
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: '未登录，请先登录', code: 'NOT_LOGGED_IN' });
  }
  next();
}

module.exports = authMiddleware;
