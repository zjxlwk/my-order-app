// 格式化工具函数

/**
 * 格式化时间戳为日期时间字符串
 * @param {string|number} timestamp - 时间戳
 * @returns {string} 格式化后的日期时间字符串，如：2023-01-01 12:30:45
 */
function formatDateTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  formatDateTime
};