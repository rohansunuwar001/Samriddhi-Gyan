// No longer need the openai import
// import OpenAI from "openai"; 

// Import your new Xenova-based embedding function and the Course model

import { Course } from "../models/course.model.js";
import { generateEmbedding } from "../service/embedding.service.js";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // REMOVED

/**
 * Cosine similarity function remains exactly the same. It's a pure math utility.
 */
export function cosineSimilarity(a = [], b = []) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Request an embedding vector for a text string using the LOCAL Xenova model.
 * This is the primary function we are swapping out.
 * @param {string} text The text to embed
 * @returns {Promise<number[]>} The embedding vector
 */
export async function createEmbeddingForText(text) {
  // The logic is now simpler: just call our dedicated service.
  const embedding = await generateEmbedding(text);
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Invalid embedding response from local model");
  }
  return embedding;
}


// ===================================================================
// ALL THE FOLLOWING HELPER FUNCTIONS CAN REMAIN EXACTLY THE SAME!
// They correctly call `createEmbeddingForText` and don't care about its
// internal implementation (whether it's OpenAI or Xenova).
// This is the beauty of good code abstraction.
// ===================================================================

/**
 * Get or create embedding for a course document.
 * Persists embedding in DB if newly created.
 */
export async function getCourseEmbedding(courseDoc) {
  // This function doesn't need to change.
  if (courseDoc.embedding && Array.isArray(courseDoc.embedding) && courseDoc.embedding.length > 0) {
    return courseDoc.embedding;
  }

  // NOTE: You might want to update the text composition to match your schema better.
  // The 'tags' property isn't in the schema you provided earlier.
  const textToEmbed = [
    courseDoc.title,
    courseDoc.subtitle,
    courseDoc.description,
    `Category: ${courseDoc.category}`,
    `Level: ${courseDoc.level}`
  ].filter(Boolean).join(". ");

  const embedding = await createEmbeddingForText(textToEmbed);

  try {
    // Note: Your schema doesn't have `embeddingUpdatedAt`. You can add it if you want.
    await Course.findByIdAndUpdate(courseDoc._id, {
      embedding,
      // embeddingUpdatedAt: new Date(),
    }).catch((err) => {
      console.warn("Failed to persist embedding:", err.message);
    });
  } catch (err) {
    console.warn("Embedding persistence error:", err.message);
  }

  return embedding;
}

/**
 * Ensures that all given courses have embeddings.
 * For courses without embeddings, creates and persists them.
 */
export async function ensureEmbeddingsForCourses(courses) {
  // This function doesn't need to change.
  const mapped = await Promise.all(
    courses.map(async (course) => {
      if (course.embedding && Array.isArray(course.embedding) && course.embedding.length > 0) return course;
      try {
        const emb = await getCourseEmbedding(course);
        return { ...course, embedding: emb };
      } catch (err) {
        console.warn(`Embedding failed for course ${course._id}:`, err.message);
        return course;
      }
    })
  );
  return mapped;
}

/**
 * Batch precompute embeddings for all courses.
 * Useful for admin scripts or migration jobs.
 */
export async function populateAllCourseEmbeddings(batchSize = 50) {
  // This function doesn't need to change.
  const total = await Course.countDocuments({ isPublished: true }); // Example filter
  let processed = 0;

  console.log(`Starting embedding population for ${total} courses...`);

  while (processed < total) {
    const batch = await Course.find({ isPublished: true })
      .skip(processed)
      .limit(batchSize)
      .lean();

    const tasks = batch.map(async (c) => {
      try {
        if (c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0) return;
        
        const textToEmbed = [
          c.title, c.subtitle, c.description, `Category: ${c.category}`, `Level: ${c.level}`
        ].filter(Boolean).join(". ");
        
        const emb = await createEmbeddingForText(textToEmbed);
        await Course.findByIdAndUpdate(c._id, { embedding: emb });
      } catch (err) {
        console.warn(`Embedding failed for ${c._id}: ${err.message}`);
      }
    });

    await Promise.all(tasks);
    processed += batch.length;
    console.log(`Processed ${processed} / ${total} courses.`);
  }
  console.log("Embedding population complete.");
}

/**
 * Build a single user profile vector by averaging enrolled courses' embeddings.
 */
export async function buildUserVectorFromEnrolled(enrolledCourses) {
  // This function doesn't need to change.
  if (!enrolledCourses || enrolledCourses.length === 0) return null;

  const enrolledWithEmb = await ensureEmbeddingsForCourses(enrolledCourses);

  const embList = enrolledWithEmb
    .map((c) => c.embedding)
    .filter((e) => Array.isArray(e) && e.length > 0);

  if (embList.length === 0) return null;

  const dim = embList[0].length;
  const userVec = new Array(dim).fill(0);

  for (const e of embList) {
    for (let i = 0; i < dim; i++) {
      userVec[i] += e[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    userVec[i] /= embList.length;
  }

  return userVec;
}