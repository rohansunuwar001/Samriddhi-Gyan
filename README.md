# 🎓 Samriddhi Gyan (समृद्धि ज्ञान)

> **Next-Generation Full-Stack Learning Management System (LMS) & Intelligent E-Learning Platform**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS%20%7C%20Radix%20UI-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/State-Redux%20Toolkit-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io&logoColor=white)](https://socket.io/)

---

## 📌 Overview

**Samriddhi Gyan** is a modern, high-performance educational platform designed to empower students, instructors, and administrators. Built with a scalable micro-monorepo architecture, it delivers seamless video streaming, intelligent course discovery, real-time collaboration, and dual-channel global/domestic payment integrations.

From interactive video learning with adaptive HLS playback to an intuitive multi-level exploration cascade and AI-powered recommendations, Samriddhi Gyan bridges the gap between learners and knowledge.

---

## 🚀 Key Features

### 🎓 Learning Experience & Streaming
- **Adaptive Bitrate Streaming**: Optimized video streaming via HLS (`hls.js`, `@vidstack/react`, and `fluent-ffmpeg`), ensuring stutter-free playback across various network conditions.
- **Interactive Course Player**: Timestamped lecture notes, bookmarking, auto-play next lecture, playback speed controls, and full-screen theater mode.
- **Progress Tracking & Quizzes**: Automated progress completion tracking with downloadable certificates upon course completion.

### 🧭 Multi-Level Progressive Category & Topic Explorer
- **3-Tier Progressive Hover Menu**: Multi-column cascading navigation (*Category ➔ Subcategory ➔ Topic*) for rapid discovery without UI jumping.
- **Curated Admin Sections**: Dynamic, customizable sections for *"New & Featured"* courses and *"Explore by Goal"* with conditional rendering and divider lines.
- **Dedicated Topic Pages**: Slug-based routes (`/topic/:slug`) powered by live server data, rich course cards, and 404 guards against manual URL tampering.

### 💳 Dual Payment Gateways
- **International Payments**: Stripe checkout integration with secure webhook verification.
- **Domestic (Nepal) Payments**: eSewa digital wallet integration with cryptographic signature generation and QR code support.

### 🤖 Intelligent Recommendations & AI
- **Smart Recommendations**: Integrated hybrid recommendation pipeline combining content similarity and user interaction vectors.
- **AI Tutoring & Search**: Google Gemini API integration for real-time course Q&A, contextual summaries, and student query assistance.

### 👥 Comprehensive User Roles & Permissions (RBAC)
- **Learners**: Wishlist, enrollment history, interactive reviews & ratings, discussion forums.
- **Instructors**: Course builder with lecture upload, curriculum organizer, pricing setup, and student engagement statistics.
- **Administrators**: Platform-wide user management, category and topic hierarchy builder, explore menu manager, revenue metrics with Recharts, and content moderation.

### 🌐 Internationalization & Accessibility
- **Multi-language Support**: Seamless localization powered by `react-i18next`.
- **Theme Support**: Polished Dark & Light mode toggle powered by `next-themes`.
- **Accessibility**: Built with WCAG 2.2 AA standards in mind, utilizing accessible Radix UI primitives.

---

## 📁 Repository Structure

```text
Samriddhi-Gyan/
├── client/                      # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI components (Navbar, Player, Cards, Admin)
│   │   ├── pages/               # Application routes (Home, CourseDetail, TopicPage, etc.)
│   │   ├── redux/               # Redux Toolkit slices and RTK Query APIs
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # Utility functions & axios configurations
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js + Express Core Backend
│   ├── controllers/             # Business logic controllers (course, category, payment, etc.)
│   ├── models/                  # Mongoose data schemas (Course, User, Category, Topic, etc.)
│   ├── routes/                  # Express REST API routes
│   ├── middlewares/             # Auth, role guards, file uploads, error handlers
│   ├── seed/                    # Database seeding scripts (e.g., blog seeder)
│   └── index.js                 # Server entry point & Socket.io setup
│
├── md/                          # 📖 Dedicated Documentation & Design Systems
│   ├── client_design.md         # Full site & navbar design system and tokens
│   ├── online_courses_design.md # Course UI token foundations & accessibility specs
│   ├── course_detail_design.md  # Course detail layout & interactive specifications
│   ├── personal_plan_design.md  # Personal learning plan system design
│   ├── search_design.md         # Search & filtering interface specifications
│   ├── SEED_README.md           # Blog & sample data seeding instructions
│   └── client_README.md         # Frontend Vite + React environment notes
│
├── .env.example                 # Root environment template and configuration guide
└── README.md                    # Primary project documentation
```

---

## 📚 Documentation Directory (`md/`)

All architecture, token specifications, design documents, and seed guides have been organized into the [`md/`](./md/) folder:

| Document | Purpose |
| :--- | :--- |
| [`client_design.md`](./md/client_design.md) | Comprehensive site & global navbar design system tokens |
| [`online_courses_design.md`](./md/online_courses_design.md) | Brand foundations, spacing scales, and WCAG accessibility standards |
| [`course_detail_design.md`](./md/course_detail_design.md) | Course landing and player interface architecture |
| [`personal_plan_design.md`](./md/personal_plan_design.md) | Subscription & personal plan UX/UI guidance |
| [`search_design.md`](./md/search_design.md) | Filter drawer, search bar, and results page specifications |
| [`SEED_README.md`](./md/SEED_README.md) | Instructions for seeding blog articles, authors, and categories |
| [`client_README.md`](./md/client_README.md) | Frontend bundling and Vite configuration details |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` recommended
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
- **Package Manager**: `npm` (v9+) or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/rohansunuwar001/Samriddhi-Gyan.git
cd "Samriddhi Gyan"
```

### 2. Environment Configuration
Copy the provided environment templates and supply your credentials:

```bash
# Server Environment
cp server/.env.example server/.env

# Client Environment
cp client/.env.example client/.env
```

Ensure your `server/.env` includes:
- `MONGO_URI`
- `PORT` (e.g. `8080`)
- `SECRET_KEY` (JWT secret)
- Cloud storage keys (Cloudinary / AWS / Cloudflare R2)
- Payment keys (`STRIPE_SECRET_KEY`, eSewa credentials)

### 3. Backend Setup
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:8080` (or specified `PORT`).

### 4. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The client will launch at `http://localhost:5173`.

### 5. Seeding Sample Data (Optional)
To populate the database with initial blog posts and categories:
```bash
cd server
npm run seed:blog
```

---

## 🔒 Security & Credential Rotation

> [!CAUTION]
> **ROTATE ALL PREVIOUSLY COMMITTED SECRETS BEFORE PRODUCTION DEPLOYMENT**
>
> Ensure any API keys, database credentials, or OAuth tokens used during local development are regenerated before publishing to production environments:
> - **Google Gemini API Key** (Google AI Studio)
> - **Google OAuth 2.0 Credentials** (Google Cloud Console)
> - **Stripe Secret & Webhook Keys** (Stripe Dashboard)
> - **eSewa Merchant Secret** (eSewa Developer Portal)
> - **Cloud Storage API Credentials** (Cloudinary / Cloudflare R2 / AWS S3)
> - **JWT & Session Secrets** (Generate strong random 64-character strings)

---

## 🧰 Available Scripts

| Area | Command | Action |
| :--- | :--- | :--- |
| **Client** | `npm run dev` | Starts Vite development server with HMR |
| **Client** | `npm run build` | Compiles production build to `client/dist` |
| **Client** | `npm run lint` | Runs ESLint analysis across frontend files |
| **Server** | `npm run dev` | Runs Express server with nodemon auto-reload |
| **Server** | `npm run seed:blog` | Upserts sample blog articles and categories |

---

## 📄 License

This project is licensed under the **ISC License**.
