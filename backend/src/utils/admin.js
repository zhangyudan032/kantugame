function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return false;
  return adminEmails.includes(email.toLowerCase());
}

module.exports = { getAdminEmails, isAdminEmail };
