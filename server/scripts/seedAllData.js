import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "../database/db.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from server root directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Cleaning up previous test seed data...");
    // Only delete test users to avoid erasing your own developer accounts
    const deletedUsers = await User.deleteMany({ email: /@samriddhigyan\.com$/ });
    console.log(`Cleaned up ${deletedUsers.deletedCount} old test users.`);

    // Hash default password
    const hashedPassword = await bcrypt.hash("password123", 10);

    const usersData = [
      {
        name: "Rohan Sunuwar",
        email: "test_user1@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Senior Full Stack Dev & Lead Instructor",
        description: "Specializing in React, Node.js, and cloud architectures.",
        locationDetails: {
          country: "Nepal",
          city: "Kathmandu",
          formattedAddress: "Baneshwor, Kathmandu, Nepal",
          latitude: 27.6915,
          longitude: 85.3422
        }
      },
      {
        name: "Ravi Sunuwar",
        email: "test_user2@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Mobile Apps Architect",
        description: "Passionate about React Native, Flutter, and iOS Swift.",
        locationDetails: {
          country: "Nepal",
          city: "Bardibas",
          formattedAddress: "Mahendra Highway, Bardibas-01, Bardibas, Nepal",
          latitude: 26.9814,
          longitude: 85.9056
        }
      },
      {
        name: "Ram Shrestha",
        email: "test_user3@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Data Scientist & Python Specialist",
        description: "Teaching machine learning, statistical modeling, and database systems.",
        locationDetails: {
          country: "Nepal",
          city: "Lalitpur",
          formattedAddress: "Patan Durbar Square, Lalitpur, Nepal",
          latitude: 27.6727,
          longitude: 85.3253
        }
      },
      {
        name: "Sita Thapa",
        email: "test_user4@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "UI/UX Designer & Product Lead",
        description: "Focusing on human-centered design, Figma layouts, and styling systems.",
        locationDetails: {
          country: "Nepal",
          city: "Pokhara",
          formattedAddress: "Lakeside Rd, Pokhara, Nepal",
          latitude: 28.2096,
          longitude: 83.9582
        }
      },
      {
        name: "Hari Devkota",
        email: "test_user5@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Cyber Security Consultant & Ethical Hacker",
        description: "Helping students master networks security, cryptography, and server hardening.",
        locationDetails: {
          country: "Nepal",
          city: "Biratnagar",
          formattedAddress: "Main Rd, Biratnagar, Nepal",
          latitude: 26.4525,
          longitude: 87.2718
        }
      },
      {
        name: "Gita Adhikari",
        email: "test_user6@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Frontend Engineer & CSS Expert",
        description: "Specializing in CSS animations, Tailwind CSS, Sass, and responsive design systems.",
        locationDetails: {
          country: "Nepal",
          city: "Chitwan",
          formattedAddress: "Bharatpur, Chitwan, Nepal",
          latitude: 27.6833,
          longitude: 84.4333
        }
      },
      {
        name: "Shyam Kumar",
        email: "test_user7@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Backend Architect & Database Administrator",
        description: "Teaching SQL optimization, MongoDB aggregation pipelines, and Redis caching.",
        locationDetails: {
          country: "Nepal",
          city: "Dharan",
          formattedAddress: "Bhanu Chowk, Dharan, Nepal",
          latitude: 26.8125,
          longitude: 87.2833
        }
      },
      {
        name: "Nira Pyakurel",
        email: "test_user8@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "DevOps Engineer & System Admin",
        description: "Teaching Docker containerization, Kubernetes orchestration, and AWS pipelines.",
        locationDetails: {
          country: "Nepal",
          city: "Hetauda",
          formattedAddress: "Seema Chowk, Hetauda, Nepal",
          latitude: 27.4264,
          longitude: 85.0308
        }
      },
      {
        name: "Sunil Ghimire",
        email: "test_user9@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Product Manager & Tech Consultant",
        description: "Helping students understand agile methodologies, user stories, and product launches.",
        locationDetails: {
          country: "Nepal",
          city: "Butwal",
          formattedAddress: "Traffic Chowk, Butwal, Nepal",
          latitude: 27.7006,
          longitude: 83.4485
        }
      },
      {
        name: "Maya Tamang",
        email: "test_user10@samriddhigyan.com",
        password: hashedPassword,
        role: "instructor",
        headline: "Java Developer & Academic Educator",
        description: "Teaching Object-Oriented Programming, Spring Framework, and DSA basics.",
        locationDetails: {
          country: "Nepal",
          city: "Lumbini",
          formattedAddress: "Sacred Garden, Lumbini, Nepal",
          latitude: 27.4789,
          longitude: 83.2758
        }
      }
    ];

    console.log("Seeding 10 users...");
    const createdUsers = await User.create(usersData);
    console.log("10 users successfully seeded!");

    // List of course titles for each creator (2 per creator)
    const coursesPool = [
      { title: "React 19 & Next.js Masterclass", subtitle: "Build server components and dynamic portals", category: "Web Development", level: "Intermediate", price: 1500 },
      { title: "Node.js & Express API Development", subtitle: "REST APIs with Mongoose and validation", category: "Web Development", level: "Intermediate", price: 1200 },
      
      { title: "React Native Mobile App Development", subtitle: "Cross-platform mobile apps from scratch", category: "Web Development", level: "All Levels", price: 1800 },
      { title: "SwiftUI iOS App Development", subtitle: "Learn Apple development using modern SwiftUI", category: "Web Development", level: "Beginner", price: 2000 },
      
      { title: "Python for Data Science Bootcamp", subtitle: "Learn Pandas, Numpy, Matplotlib, and Scikit-learn", category: "Web Development", level: "Beginner", price: 1600 },
      { title: "Machine Learning with TensorFlow", subtitle: "Build regression, classification, and neural nets", category: "Web Development", level: "Advanced", price: 2500 },
      
      { title: "UI/UX Design Essentials using Figma", subtitle: "Wireframe, prototype, and build vector styles", category: "Web Development", level: "Beginner", price: 1100 },
      { title: "Responsive Web Design Masterclass", subtitle: "Modern CSS Grid, Flexbox, and Tailwind layouts", category: "Web Development", level: "All Levels", price: 900 },
      
      { title: "Ethical Hacking and Penetration Testing", subtitle: "Learn network security, Kali Linux, and Nmap basics", category: "Web Development", level: "All Levels", price: 2200 },
      { title: "Network Defense and Server Hardening", subtitle: "Secure Nginx, SSH, and master firewall setups", category: "Web Development", level: "Intermediate", price: 1900 },
      
      { title: "Mastering CSS Grid and Animations", subtitle: "Creative layouts with transitions and keyframes", category: "Web Development", level: "All Levels", price: 800 },
      { title: "Tailwind CSS Component Designing", subtitle: "Fast, custom landing page layout development", category: "Web Development", level: "Beginner", price: 950 },
      
      { title: "Advanced SQL & Database Management", subtitle: "Query optimization, indexing, and window functions", category: "Web Development", level: "Advanced", price: 1400 },
      { title: "MongoDB Aggregations Demystified", subtitle: "Stage pipelines, lookups, and geospatial indexes", category: "Web Development", level: "Intermediate", price: 1300 },
      
      { title: "Docker Containerization for Beginners", subtitle: "Configure Dockerfiles, compose multi-container apps", category: "Web Development", level: "Beginner", price: 1250 },
      { title: "Kubernetes Orchestration in Production", subtitle: "Deploy pods, services, and manage ingress pipelines", category: "Web Development", level: "Advanced", price: 2700 },
      
      { title: "Product Management 101 for Tech", subtitle: "From user research to agile roadmap execution", category: "Web Development", level: "All Levels", price: 1500 },
      { title: "Agile Scrum & Jira Workflows", subtitle: "Organize sprints, backlog grooming, and team velocity", category: "Web Development", level: "Beginner", price: 1100 },
      
      { title: "Java OOPs & Spring Boot Framework", subtitle: "Build enterprise REST APIs using Spring Boot", category: "Web Development", level: "Intermediate", price: 1750 },
      { title: "Data Structures & Algorithms in Java", subtitle: "Trees, Graphs, Sorting, and Big O Complexity", category: "Web Development", level: "Advanced", price: 1950 }
    ];

    console.log("Seeding 20 courses (2 per creator)...");
    const coursesToInsert = [];

    const thumbnailsPool = [
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=720&auto=format&fit=crop", // React
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=720&auto=format&fit=crop", // Node
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=720&auto=format&fit=crop", // React Native
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=720&auto=format&fit=crop", // SwiftUI
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=720&auto=format&fit=crop", // Python
      "https://images.unsplash.com/photo-1527474305487-b87b222841cc?q=80&w=720&auto=format&fit=crop", // TensorFlow
      "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=720&auto=format&fit=crop", // Figma
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=720&auto=format&fit=crop", // CSS Grid
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=720&auto=format&fit=crop", // Ethical Hacking
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=720&auto=format&fit=crop", // Network defense
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=720&auto=format&fit=crop", // CSS Animations
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=720&auto=format&fit=crop", // Tailwind
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=720&auto=format&fit=crop", // Advanced SQL
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=720&auto=format&fit=crop", // MongoDB
      "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=720&auto=format&fit=crop", // Docker
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=720&auto=format&fit=crop", // Kubernetes
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=720&auto=format&fit=crop", // Product Management
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=720&auto=format&fit=crop", // Scrum
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=720&auto=format&fit=crop", // Java OOP
      "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=720&auto=format&fit=crop"  // DSA
    ];

    for (let i = 0; i < createdUsers.length; i++) {
      const creator = createdUsers[i];
      const course1Data = coursesPool[i * 2];
      const course2Data = coursesPool[i * 2 + 1];

      const cleanTitle1 = `test-course-${course1Data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const cleanTitle2 = `test-course-${course2Data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      // Clean up previous test courses with matching names
      await Course.deleteMany({ slug: { $in: [cleanTitle1, cleanTitle2] } });

      coursesToInsert.push({
        title: course1Data.title,
        subtitle: course1Data.subtitle,
        description: `This is a test seed course titled ${course1Data.title}. Learn modern industry skills with our expert guidance.`,
        language: "English",
        category: course1Data.category,
        level: course1Data.level,
        price: {
          original: course1Data.price + 500,
          current: course1Data.price
        },
        thumbnail: thumbnailsPool[i * 2],
        creator: creator._id,
        isPublished: true,
        includedInSubscription: true
      });

      coursesToInsert.push({
        title: course2Data.title,
        subtitle: course2Data.subtitle,
        description: `This is a test seed course titled ${course2Data.title}. Learn modern industry skills with our expert guidance.`,
        language: "English",
        category: course2Data.category,
        level: course2Data.level,
        price: {
          original: course2Data.price + 500,
          current: course2Data.price
        },
        thumbnail: thumbnailsPool[i * 2 + 1],
        creator: creator._id,
        isPublished: true,
        includedInSubscription: true
      });
    }

    const createdCourses = await Course.create(coursesToInsert);
    console.log(`20 courses successfully seeded! Total inserted: ${createdCourses.length}`);

    // Update creators enrolled/created arrays
    for (const course of createdCourses) {
      await User.findByIdAndUpdate(course.creator, {
        $push: { enrolledCourses: course._id } // Seeding instructors as enrolled in their own courses
      });
    }

    console.log("Database successfully seeded!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
};

seedDatabase();
