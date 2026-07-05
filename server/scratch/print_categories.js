import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../database/db.js';
import Category from '../models/category.model.js';

dotenv.config({ path: './.env' });

async function run() {
  await connectDB();
  
  const categories = await Category.find({}).lean();
  
  const buildTree = (parentId = null, indent = '') => {
    const children = categories.filter(c => {
      const pid = c.parent?._id?.toString() || c.parent?.toString() || null;
      const targetPid = parentId?.toString() || null;
      return pid === targetPid;
    });
    
    children.forEach(child => {
      console.log(`${indent}- ${child.name} (id: ${child._id}, slug: ${child.slug})`);
      buildTree(child._id, indent + '  ');
    });
  };
  
  console.log('Category Tree:');
  buildTree(null);
  
  await mongoose.disconnect();
}

run();
