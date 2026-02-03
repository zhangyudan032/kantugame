function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function adminMiddleware(req, res, next) {
  const adminEmails = parseAdminEmails();
  if (!adminEmails.length) {
    return res.status(403).json({ error: "管理员未配置", code: "ADMIN_NOT_CONFIGURED" });
  }
  const email = req.session?.email?.toLowerCase();
  if (!email || !adminEmails.includes(email)) {
    return res.status(403).json({ error: "无权限访问", code: "NOT_ADMIN" });
  }
  next();
}

module.exports = adminMiddleware;
