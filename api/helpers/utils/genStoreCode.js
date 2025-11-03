exports.generateStoreCode = (prefix = "STR") => {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${random}${timestamp}`;
};
