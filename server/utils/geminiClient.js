import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { Lecture } from "../models/lecture.model.js";

const db = {
  User,
  Course,
  Lecture,
};

const getModelSchemas = async () => {
  const models = {
    User: db.User.schema.obj,
    Course: db.Course.schema.obj,
    Lecture: db.Lecture.schema.obj,
  };
  return JSON.stringify(models, null, 2);
};

export const generateGeminiResponse = async (promptText, context = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here" || apiKey === "") {
    console.warn("GEMINI_API_KEY is not set or empty. Using LMS local learning assistant helper fallback.");
    
    const lowerPrompt = promptText.toLowerCase();
    let answer = "I'm your AI Course Assistant. I'm here to help you understand the curriculum, explain concepts, and guide your learning journey!";
    
    if (lowerPrompt.includes("help") || lowerPrompt.includes("web developer")) {
      answer = "This course covers all aspects of full-stack web development, teaching you frontend layout systems, React state management, and backend database integrations. You'll build complete portfolio projects that show employers you are ready for entry-level developer roles.";
    } else if (lowerPrompt.includes("apply") || lowerPrompt.includes("job")) {
      answer = "You can apply the knowledge from this course to build custom dashboards, configure databases, write secure APIs, and deploy responsive web interfaces. Try building your own side projects alongside the course to practice the concepts.";
    } else if (lowerPrompt.includes("special education") && lowerPrompt.includes("child")) {
      answer = "Special education is a way of teaching that helps children who learn in different ways. Teachers use special tools, games, and extra patience so every child has a fun and successful way to learn and grow at their own speed.";
    } else if (lowerPrompt.includes("special education") && lowerPrompt.includes("simpler")) {
      answer = "Special education refers to individually designed instruction and supports meeting the unique learning needs of students with disabilities, ensuring equal educational access and developmental progress.";
    } else if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi")) {
      answer = "Hello! I am your LMS learning assistant. Feel free to ask me any questions about full stack development, lectures, coding, or any specific topic from this course.";
    } else {
      answer = `That is a great question! Regarding your query: "${promptText}", here are some recommended learning steps:
\n1. Review the code samples and reference documents included with the lecture.
\n2. Open your local editor and practice implementing the codebase patterns yourself.
\n3. Reach out in the course Q&A tab if you have specific code bugs or error logs!`;
    }
    return answer;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const schemaInfo = await getModelSchemas();
    const enhancedPrompt = `
    You are an AI assistant for an LMS platform named Samriddhi Gyan. Below is the database schema, user context, and current course/lecture context.

    Database Schema:
    ${schemaInfo}

    User Context:
    ${
      context.user
        ? JSON.stringify(context.user, null, 2)
        : "No user context provided"
    }

    Course Context:
    ${
      context.course
        ? JSON.stringify(context.course, null, 2)
        : "No course context provided"
    }

    Current Lecture Context:
    ${
      context.lecture
        ? JSON.stringify(context.lecture, null, 2)
        : "No lecture context provided"
    }

    Current Query:
    ${promptText}

    Instructions:
    1. Provide accurate and helpful responses based on the provided Course Context and Lecture Context.
    2. If the user asks about the course curriculum, content, or relevance to careers (e.g. web developer, jobs), use the course title, description, learnings, and requirements.
    3. If the user asks about the current lecture, explain the concept using the lecture title, description, and transcript text if available.
    4. Speak directly, concisely, and encouragingly as an expert instructor or learning assistant at Samriddhi Gyan.
    5. If a query is unrelated to the course and schema, you can still answer general programming/concepts helpfully, but relate it to full stack development when possible.

    Response:
    `;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error processing your request. Please check back later.";
  }
};
