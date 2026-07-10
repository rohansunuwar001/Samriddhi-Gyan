// server/seed/seedBlog.js
//
// One-command blog seeder. Reads server/seed/blogSeedData.js and upserts
// categories, authors, and articles into MongoDB — safe to re-run any time
// (re-running updates existing docs instead of duplicating them).
//
// USAGE (from the server/ directory, alongside package.json):
//   node seed/seedBlog.js
//
// Or add to package.json:
//   "scripts": { "seed:blog": "node seed/seedBlog.js" }
// then run:
//   npm run seed:blog

import dotenv from "dotenv";
import mongoose from "mongoose";

import Category from "../models/category.model.js";
import Author from "../models/author.model.js";
import Article from "../models/article.model.js";
import { slugify } from "../utils/slugify.js";
import { categories, authors, articles } from "./blogSeedData.js";

dotenv.config();

const log = (msg) => console.log(`[seed:blog] ${msg}`);

async function connect() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "No MongoDB connection string found. Set MONGO_URI (or MONGODB_URI) in your .env file."
    );
  }
  await mongoose.connect(uri);
  log("Connected to MongoDB.");
}

async function upsertCategories() {
  const nameToId = new Map();

  for (const name of categories) {
    const slug = slugify(name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      { name, slug },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    nameToId.set(name, doc._id);
  }

  log(`Upserted ${categories.length} categories.`);
  return nameToId;
}

async function upsertAuthors() {
  const nameToId = new Map();

  for (const author of authors) {
    const slug = slugify(author.name);
    const doc = await Author.findOneAndUpdate(
      { slug },
      { name: author.name, slug, avatar: author.avatar, bio: author.bio },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    nameToId.set(author.name, doc._id);
  }

  log(`Upserted ${authors.length} authors.`);
  return nameToId;
}

async function upsertArticles(categoryIds, authorIds) {
  let created = 0;
  let updated = 0;
  const skipped = [];

  for (const article of articles) {
    const categoryId = categoryIds.get(article.category);
    const authorId = authorIds.get(article.author);

    if (!categoryId) {
      skipped.push(`"${article.title}" — unknown category "${article.category}"`);
      continue;
    }
    if (!authorId) {
      skipped.push(`"${article.title}" — unknown author "${article.author}"`);
      continue;
    }

    const slug = slugify(article.title);
    const existing = await Article.findOne({ slug });

    const payload = {
      title: article.title,
       slug,
      featuredImage: article.featuredImage,
      content: article.content,
      author: authorId,
      category: categoryId,
      popular: article.popular ?? false,
    };

    if (existing) {
      Object.assign(existing, payload);
      await existing.save(); // triggers pre-save slug hook, harmless re-slugify
      updated += 1;
    } else {
      const doc = new Article(payload);
      await doc.save(); // pre-save hook generates the slug
      created += 1;
    }
  }

  log(`Articles: ${created} created, ${updated} updated.`);
  if (skipped.length > 0) {
    log(`Skipped ${skipped.length} article(s) due to missing references:`);
    skipped.forEach((s) => log(`  - ${s}`));
  }
}

async function run() {
  try {
    await connect();
    const categoryIds = await upsertCategories();
    const authorIds = await upsertAuthors();
    await upsertArticles(categoryIds, authorIds);
    log("Done.");
  } catch (error) {
    console.error("[seed:blog] FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();