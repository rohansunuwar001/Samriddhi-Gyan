// server/helpers/searchSuggestion.helper.js
//
// Centralizes "add this term to the search-suggestion pool" so every place
// that creates a Category, Course topic, or Article doesn't duplicate the
// upsert logic. Call this any time a new searchable term enters the system.

import { SearchSuggestion } from "../models/searchSuggestion.js";

/**
 * Upsert a single term into the SearchSuggestion collection.
 * Silently no-ops on empty/whitespace input. Never throws — a suggestion
 * sync failure should never block the primary save (category/course/article).
 *
 * @param {string} term
 */
export const upsertSearchSuggestion = async (term) => {
  const cleaned = term?.trim();
  if (!cleaned) return;

  try {
    await SearchSuggestion.updateOne(
      { term: cleaned.toLowerCase() },
      { $setOnInsert: { term: cleaned.toLowerCase() } },
      { upsert: true }
    );
  } catch (error) {
    // Duplicate-key races are expected under concurrent requests; ignore.
    // Anything else just gets logged — suggestions are a nice-to-have, not critical.
    console.error(`WARN: Failed to sync search suggestion "${cleaned}":`, error.message);
  }
};

/**
 * Upsert many terms at once (e.g. a course's full topics array).
 * @param {string[]} terms
 */
export const upsertSearchSuggestions = async (terms = []) => {
  await Promise.all(terms.map((t) => upsertSearchSuggestion(t)));
};