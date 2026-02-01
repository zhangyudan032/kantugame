// 获取北京时间的 ISO 字符串（不带时区，直接存储北京时间值）
function getBeijingTime() {
  const now = new Date();
  // 北京时间 = UTC + 8小时
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  // 返回不带Z的ISO格式，让数据库直接存储这个值
  return beijingTime.toISOString().slice(0, -1);
}

module.exports = { getBeijingTime };
