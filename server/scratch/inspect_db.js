import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../database/db.js';
import Category from '../models/category.model.js';
import Topic from '../models/topic.model.js';

dotenv.config({ path: './.env' });

async function run() {
  await connectDB();
  
  console.log('\n--- ALL CATEGORIES ---');
  const categories = await Category.find({}).lean();
  console.log(JSON.stringify(categories, null, 2));

  console.log('\n--- ALL TOPICS / CERTIFICATIONS ---');
  const topics = await Topic.find({}).lean();
  console.log(JSON.stringify(topics, null, 2));

  await mongoose.disconnect();
}

run();
