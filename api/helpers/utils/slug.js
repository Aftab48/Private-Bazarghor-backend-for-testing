/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug
 */
const generateSlug = (text) => {
  if (!text) return "";
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, ""); // Trim hyphens from end
};

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param {string} baseSlug - The base slug
 * @param {Function} checkExists - Function that checks if slug exists (returns Promise)
 * @param {string} excludeId - Optional ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - The unique slug
 */
const generateUniqueSlug = async (baseSlug, checkExists, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const exists = await checkExists(slug, excludeId);
    if (!exists) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
};

