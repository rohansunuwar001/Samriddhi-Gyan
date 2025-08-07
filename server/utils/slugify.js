export const slugify = (text) => {
  if (typeof text !== 'string') {
    return ''; // Return an empty string if the input is not a string
  }

  return text
    .toString()                   // Ensure it's a string
    .toLowerCase()                // 1. Convert to lowercase
    .trim()                       // 2. Trim leading/trailing whitespace
    .replace(/\s+/g, '-')         // 3. Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // 4. Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-');      // 5. Replace multiple - with single -
};