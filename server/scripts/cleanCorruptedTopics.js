// server/scripts/cleanCorruptedTopics.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { sanitizeTopics } from "../helpers/topic.helper.js";

async function cleanCourses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses to check/clean.`);

    for (const course of courses) {
      const originalTopics = course.topics || [];
      const originalPrimary = course.primaryTopic;

      const cleanedTopics = sanitizeTopics(originalTopics);
      let cleanedPrimary = course.primaryTopic ? sanitizeTopics(course.primaryTopic)[0] : "";
      if (!cleanedPrimary || !cleanedTopics.includes(cleanedPrimary)) {
        cleanedPrimary = cleanedTopics[0] || "";
      }

      console.log(`Course: "${course.title}"`);
      console.log("  Old topics:", originalTopics);
      console.log("  Clean topics:", cleanedTopics);
      console.log("  Old primary:", originalPrimary);
      console.log("  Clean primary:", cleanedPrimary);

      course.topics = cleanedTopics;
      course.primaryTopic = cleanedPrimary;
      course.markModified("topics");
      await course.save();
      console.log("  -> Updated successfully.\n");
    }

    console.log("All courses cleaned successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
}

cleanCourses();
