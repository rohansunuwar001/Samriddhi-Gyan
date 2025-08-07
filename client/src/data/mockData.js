// src/data/mockData.js

// This file is now the single source of truth for all blog articles.

export const blogArticles = [
  // --- DEVELOPMENT ARTICLES ---
  {
    id: 1,
    slug: "job-searching-with-ai",
    category: "Development",
    title: "Job Searching with AI: The Ultimate Guide with Example Prompts",
    lastUpdated: "August 2025",
    author: {
      name: "Rachel Anderson",
      avatar: "https://i.pravatar.cc/40?u=rachelanderson",
      bio: "Rachel is a career coach and tech enthusiast specializing in the impact of AI on the modern workforce.",
      recentArticles: [{ id: 4, slug: "what-is-vibe-coding", title: "What is Vibe Coding?" }]
    },
    featuredImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop",
    content: [
      { type: 'paragraph', text: "The landscape of job searching has been revolutionized by AI. This guide provides actionable prompts to use with tools like ChatGPT to enhance your resume, cover letters, and interview preparation." },
      { type: 'heading', level: 2, text: "Crafting the Perfect Resume with AI" },
      { type: 'paragraph', text: "Start by feeding the AI your current resume and the job description. Use prompts like: 'Act as a professional resume writer. Review my resume and suggest 5 improvements based on this job description for a Senior Frontend Developer role.'" }
    ],
    popular: false,
  },
  {
    id: 5,
    slug: "types-of-ai",
    category: "Development",
    title: "Types of AI: Understanding Artificial Intelligence",
    lastUpdated: "June 2025",
    author: {
      name: "Genefa Murphy",
      avatar: "https://i.pravatar.cc/40?u=genefamurphy",
      bio: "Genefa Murphy is a leading researcher in machine learning and artificial intelligence, focusing on educational applications.",
      recentArticles: []
    },
    featuredImage: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1000&auto=format&fit=crop",
    content: [
      { type: 'paragraph', text: "Artificial Intelligence (AI) is a broad field with many different branches. Understanding these distinctions is key to grasping its impact. The main categories are Narrow AI, General AI, and Superintelligence." },
      { type: 'heading', level: 2, text: "Artificial Narrow Intelligence (ANI)" },
      { type: 'paragraph', text: "Often called Weak AI, ANI is the only type of AI we have successfully realized to date. It is goal-oriented and designed to perform a single task, such as facial recognition, voice assistants like Siri, or driving a car. While it can seem very intelligent, it operates within a limited, pre-defined range." },
    ],
    popular: true,
  },
  // Add other development articles similarly...

  // --- IT & SOFTWARE ARTICLES ---
  {
    id: 7,
    slug: "high-demand-cybersecurity-jobs-2025",
    category: "IT & Software",
    title: "High-Demand Cybersecurity Jobs to Pursue in 2025",
    lastUpdated: "July 2025",
    author: {
      name: "Mouliya Bollinadi",
      avatar: "https://i.pravatar.cc/40?u=mouliyab",
      bio: "Mouliya Bollinadi is a certified cybersecurity analyst and educator with over a decade of experience in network security.",
      recentArticles: [{ id: 10, slug: 'comptia-security-plus-certification-guide', title: 'CompTIA Security+ Certification Guide' }]
    },
    featuredImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
    content: [
      { type: 'paragraph', text: "As our world becomes more digital, the need for skilled cybersecurity professionals has skyrocketed. In 2025, several roles are projected to be in extremely high demand due to the increasing complexity of cyber threats." },
      { type: 'heading', level: 2, text: "Top 3 In-Demand Roles" },
      { type: 'paragraph', text: "1. Cloud Security Engineer: With the mass migration to cloud services, specialists who can secure cloud infrastructure are invaluable. 2. Penetration Tester (Ethical Hacker): Companies are proactively hiring testers to find vulnerabilities before malicious hackers do. 3. Security Analyst (SOC): The heart of any security operation, analysts monitor and respond to threats in real-time." }
    ],
    popular: true,
  },
  // ... other IT & Software articles

  // --- MARKETING ARTICLES ---
  {
    id: 15,
    slug: "what-is-an-influencer",
    category: "Marketing",
    title: "What is an Influencer?",
    lastUpdated: "July 2025",
    author: {
      name: 'Jennifer Kim',
      avatar: 'https://i.pravatar.cc/40?u=jenniferkim',
      bio: "Jennifer Kim is the Content Marketing Manager at Aspire, the leading influencer marketing platform for performance-driven brands. She translates trends and strategies into actionable insights that help marketers turn creators into their most powerful growth channel.",
      recentArticles: [
        { id: 16, slug: 'how-to-become-social-media-influencer', title: 'How to Become a Social Media Influencer' }
      ]
    },
    featuredImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
    content: [
      { type: 'paragraph', text: "When people see how much money influencers make, they often wonder what it would take to become one. Nobody earns brand partnerships with zero followers, so you'll have to build a following. Once you've found your audience, you could become a full-time influencer with active and passive income." },
      { type: 'heading', level: 2, text: "Defining an Influencer" },
      { type: 'paragraph', text: "An influencer is a public figure with the ability to sway the habits and opinions of others. They typically operate on social media, sharing glimpses of their lives, recommending products, partnering with brands, and selling a lifestyle that other people want to achieve." },
      { type: 'paragraph', text: "TikTok, YouTube, and Instagram are popular for influencers because it's easy to share photos and videos on those platforms. However, some gather a niche following on Bluesky, Threads, or Twitter/X. An influencer could have tens of thousands of followers on one platform and only a few hundred on another." },
      { type: 'heading', level: 2, text: "Different Types of Influencers" },
      { type: 'paragraph', text: "Influencers fall into different categories depending on their audience size. Mega and macro-influencers use their fame to influence pop culture's biggest fashion, music, and lifestyle trends. While nano and micro-influencers have less followers, they can shape trends and sell products in their chosen niche." },
      { type: 'heading', level: 3, text: "Mega-Influencers" },
      { type: 'paragraph', text: "Mega-influencers are well-known social media stars and celebrities, such as Alix Earle or Kim Kardashian, who have over 1 million followers. They often partner with major brands and could receive tens of thousands of dollars (or even millions) for a single ad." },
      { type: 'heading', level: 2, text: "Become an Influencer With Udemy" },
      { type: 'paragraph', text: "We offer several courses to help you kickstart your career. The Be a Social Media Influencer course teaches you how to navigate the entire process, including finding your niche, developing your brand, building an audience, and dealing with online trolls." },
    ]
  },
  // Add other articles with full content as needed
];

// This remains the same, used for category navigation
export const allCategories = [
    'Development',
    'IT & Software',
    'Data Science',
    'Soft Skills',
    'HR and L&D',
    'Business',
    'Office Productivity',
    'Marketing',
    'Design',
    'Career Accelerator'
];