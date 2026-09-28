// server/helpers/topic.helper.js

/**
 * Normalizes and sanitizes course topics:
 * - Unpacks nested JSON strings, stringified arrays (e.g. '["Communication","Business"]'), or arrays of strings.
 * - Strips unwanted escaped quotes and brackets.
 * - Deduplicates case-insensitively while preserving original casing.
 * - Filters out empty or non-string items.
 *
 * @param {Array|string|any} rawTopics
 * @returns {string[]} Clean, flat array of unique topic names.
 */
export const sanitizeTopics = (rawTopics) => {
  if (!rawTopics) return [];

  let list = [];
  if (Array.isArray(rawTopics)) {
    list = rawTopics;
  } else if (typeof rawTopics === "string") {
    list = [rawTopics];
  } else {
    return [];
  }

  const result = [];

  const processItem = (item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach(processItem);
      return;
    }
    if (typeof item === "string") {
      let str = item.trim();
      if (!str) return;

      // Handle JSON array strings e.g. '["Communication","Business"]' or '["[\"...\"]"]'
      if ((str.startsWith("[") && str.endsWith("]")) || str.includes('["') || str.includes("['")) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            parsed.forEach(processItem);
            return;
          }
        } catch (_) {
          try {
            const unescaped = str.replace(/\\"/g, '"').replace(/^"/, "").replace(/"$/, "");
            const parsed = JSON.parse(unescaped);
            if (Array.isArray(parsed)) {
              parsed.forEach(processItem);
              return;
            }
          } catch (__) {
            const extracted = str.match(/[^\[\],"\\]+/g);
            if (extracted && extracted.length > 0) {
              extracted.forEach(processItem);
              return;
            }
          }
        }
      }

      // Clean remaining quotes/brackets if any
      str = str.replace(/^["'\[]+|["'\]]+$/g, "").trim();
      if (str && !result.some((t) => t.toLowerCase() === str.toLowerCase())) {
        result.push(str);
      }
    }
  };

  list.forEach(processItem);
  return result;
};
