import { Course } from "../models/course.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { createEmbeddingForText, cosineSimilarity } from "../utils/embedding.js";
import { LRUCache } from "../utils/lruCache.js";

// Cache up to 200 unique query searches to avoid redundant vector generation/db calls
const searchCache = new LRUCache(200);

/**
 * Helper to compute the Soundex code of a word for phonetic matching fallback.
 */
function getSoundex(word) {
  const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return "0000";
  const codes = {
    B: 1, F: 1, P: 1, V: 1,
    C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
    D: 3, T: 3,
    L: 4,
    M: 5, N: 5,
    R: 6
  };
  let out = clean[0];
  for (let i = 1; i < clean.length; i++) {
    const code = codes[clean[i]];
    if (code && code !== codes[clean[i-1]]) {
      out += code;
    }
  }
  return (out + "0000").slice(0, 4);
}

/**
 * Checks if there is a phonetic word overlap between the query and course text.
 */
function checkPhoneticMatch(queryWords, textToMatch) {
  if (!textToMatch) return false;
  const matchWords = textToMatch.split(/\s+/).filter(Boolean);
  const matchPhonetics = matchWords.map(getSoundex);
  return queryWords.some(qw => matchPhonetics.includes(getSoundex(qw)));
}

/**
 * @desc    Get comprehensive search results based on a query using Hybrid Semantic Vector Search,
 *          LRU Caching, and Phonetic Fallbacks.
 * @route   GET /api/search?q=your_query
 * @access  Public
 */
export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;

    // Return empty results if the query is missing or empty
    if (!q || q.trim() === '') {
      return res.status(200).json({ suggestions: [], courses: [] });
    }

    const trimmedQuery = q.trim();
    const cacheKey = trimmedQuery.toLowerCase();

    // Check LRU Cache
    const cachedResponse = searchCache.get(cacheKey);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }

    // Sanitize the query to prevent Regex Injection attacks
    const sanitizedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(sanitizedQuery, 'i'); // 'i' for case-insensitivity

    // Run query embedding generation and database queries in parallel
    const [queryEmbedding, allCourses, suggestionDocs] = await Promise.all([
      // Generate search vector embedding
      createEmbeddingForText(trimmedQuery).catch((err) => {
        console.warn("Search embedding generation failed — falling back to text matching.", err.message);
        return null;
      }),

      // Fetch all published courses with creator populated
      Course.find({ isPublished: true })
        .populate("creator", "name")
        .select("title subtitle thumbnail category topics embedding creator")
        .lean(),

      // Find search suggestions matching the pattern
      SearchSuggestion.find({ term: searchRegex }).limit(8).lean()
    ]);

    // Format suggestions
    const suggestions = suggestionDocs.map(s => s.term);
    const queryWords = trimmedQuery.split(/\s+/).filter(Boolean);

    let finalCourses = [];

    if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
      // Calculate Hybrid Score
      const scoredCourses = allCourses.map((course) => {
        // 1. Semantic Cosine Similarity (Weight: 50%)
        const similarity = course.embedding && course.embedding.length > 0
          ? cosineSimilarity(queryEmbedding, course.embedding)
          : 0;

        // 2. Keyword/Regex Match Bonus (Weight: 30%)
        const creatorName = course.creator?.name || "";
        const titleMatch = course.title && searchRegex.test(course.title);
        const subtitleMatch = course.subtitle && searchRegex.test(course.subtitle);
        const categoryMatch = course.category && searchRegex.test(course.category);
        const topicsMatch = Array.isArray(course.topics) && course.topics.some(t => searchRegex.test(t));
        const creatorMatch = creatorName && searchRegex.test(creatorName);

        const hasKeywordMatch = titleMatch || subtitleMatch || categoryMatch || topicsMatch || creatorMatch;
        const keywordBonus = hasKeywordMatch ? 0.3 : 0.0;

        // 3. Phonetic Match Bonus (Weight: 20%)
        // Helps match words that sound similar even if misspelled
        const phoneticMatch = checkPhoneticMatch(queryWords, course.title) || 
                              checkPhoneticMatch(queryWords, course.category) ||
                              (Array.isArray(course.topics) && course.topics.some(t => checkPhoneticMatch(queryWords, t)));
        const phoneticBonus = phoneticMatch ? 0.2 : 0.0;

        // Combined Score: Max 1.0 (Similarity 0.5 + Keyword 0.3 + Phonetic 0.2)
        const score = similarity * 0.5 + keywordBonus + phoneticBonus;

        return {
          ...course,
          score,
          hasKeywordMatch,
          phoneticMatch
        };
      });

      // Filter out courses that have extremely low similarity and no matches
      const filteredCourses = scoredCourses.filter(c => c.score > 0.25 || c.hasKeywordMatch || c.phoneticMatch);

      // Sort by score descending and take the top 5
      filteredCourses.sort((a, b) => b.score - a.score);
      finalCourses = filteredCourses.slice(0, 5).map(c => ({
        _id: c._id,
        title: c.title,
        thumbnail: c.thumbnail,
        creatorName: c.creator?.name || ""
      }));
    } else {
      // Fallback: pure keyword and phonetic based search
      const matched = allCourses.filter((course) => {
        const creatorName = course.creator?.name || "";
        const textMatch = (
          (course.title && searchRegex.test(course.title)) ||
          (course.subtitle && searchRegex.test(course.subtitle)) ||
          (course.category && searchRegex.test(course.category)) ||
          (Array.isArray(course.topics) && course.topics.some(t => searchRegex.test(t))) ||
          (creatorName && searchRegex.test(creatorName))
        );

        const phoneticMatch = checkPhoneticMatch(queryWords, course.title) || 
                              checkPhoneticMatch(queryWords, course.category);

        return textMatch || phoneticMatch;
      });

      finalCourses = matched.slice(0, 5).map(c => ({
        _id: c._id,
        title: c.title,
        thumbnail: c.thumbnail,
        creatorName: c.creator?.name || ""
      }));
    }

    const responsePayload = { suggestions, courses: finalCourses };
    
    // Save to LRU cache
    searchCache.put(cacheKey, responsePayload);

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({ message: 'Server error during search.' });
  }
};