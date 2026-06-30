# Blog Seed — Quick Start

## Files
- `blogSeedData.js` — edit this to add/change articles, authors, categories. Authors and categories are referenced by **name**, not by database ID — the script resolves names automatically.
- `seedBlog.js` — the runner. Safe to run as many times as you want; it upserts (creates if missing, updates if it already exists) instead of duplicating.

## Setup (one-time)
1. Drop both files into `server/seed/`.
2. Add this line to your `server/package.json` under `"scripts"`:
   ```json
   "seed:blog": "node seed/seedBlog.js"
   ```

## Running it
From your `server/` directory:
```bash
npm run seed:blog
```
or directly:
```bash
node seed/seedBlog.js
```

It uses the same `MONGO_URI` (or `MONGODB_URI`) from your `.env` that your main app already connects with.

## Adding more articles later
Open `blogSeedData.js`, add a new author/category if needed, then add an article object to the `articles` array — `category` and `author` are just the name strings you already used above. Run the command again. Nothing else changes.

## Why this is safe to re-run
- Categories and authors are matched by their slug (derived from name) — running twice never creates duplicates.
- Articles are matched by slug (derived from title) — editing an article's content in this file and re-running updates the existing database record instead of creating a second copy.
