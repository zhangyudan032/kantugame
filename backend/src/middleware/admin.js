const { getAdminEmails, isAdminEmail } = require('../utils/admin');

function adminMiddleware(req, res, next) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) {
    return res.status(403).json({ error: "管理员未配置", code: "ADMIN_NOT_CONFIGURED" });
  }
  const email = req.session?.email;
  if (!isAdminEmail(email)) {
    return res.status(403).json({ error: "无权限访问", code: "NOT_ADMIN" });
  }
  next();
}

module.exports = adminMiddleware;
