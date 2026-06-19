# EcoTrack – Carbon Footprint Awareness Platform

EcoTrack is a modern, professional, hackathon-ready full-stack web application designed to help users calculate, track, and reduce their daily carbon footprint. It features an aesthetic glassmorphism UI, a local JSON database (ideal for offline-ready hackathon deployments), and an AI Sustainability Assistant powered by the free, open-source-friendly Pollinations.ai Text API.

---

## Key Features

1. **Carbon Footprint Calculator**: Enter daily activities (transportation, electricity, water, gas, waste) to calculate instantly.
2. **Interactive Dashboard**: Track trends over time with visual doughnut and line charts powered by Chart.js.
3. **AI Sustainability Assistant**: Get personalized, actionable tips based on your latest footprint log or ask freeform eco-questions (runs entirely out-of-the-box with zero API key configuration!).
4. **Eco Challenges**: Participate in gamified daily and weekly eco-friendly tasks to earn points and level up.
5. **Global Leaderboard**: Compete with other eco-warriors based on sustainability scores.
6. **Downloadable PDF Reports**: Instantly export your progress to PDF with the click of a button.
7. **Admin Dashboard**: Manage challenges, view platform statistics, and track active users.

---

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism layout, Outfit Google Font), JavaScript (ES6+), FontAwesome Icons.
- **Backend**: Node.js, Express.js.
- **AI Integration**: Pollinations.ai Text API (Free, zero-setup, open-source LLM proxy).
- **Data Storage**: Local JSON storage (`backend/data/`).
- **Dependencies**: `express`, `cors`, `dotenv`, `body-parser`, `jsonwebtoken`, `uuid`.

---

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)

### Backend Setup

1. Open your terminal in the root directory.
2. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and verify settings:
   ```env
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key_here
   ```
4. Start the backend server:
   ```bash
   node backend/server.js
   ```
   The backend will start running at `http://localhost:3000`.

### Frontend Setup

Since the backend serves static frontend files, simply open your browser and go to:
`http://localhost:3000`

---

## Folder Structure

```
├── backend/
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── calculatorController.js
│   │   ├── challengeController.js
│   │   └── leaderboardController.js
│   ├── data/
│   │   ├── challenges.json
│   │   ├── reports.json
│   │   └── users.json
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── calculatorRoutes.js
│   │   ├── challengeRoutes.js
│   │   └── leaderboardRoutes.js
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── ai-assistant.js
│   │   ├── calculator.js
│   │   ├── challenges.js
│   │   ├── dashboard.js
│   │   ├── leaderboard.js
│   │   └── main.js
│   ├── admin.html
│   ├── ai-assistant.html
│   ├── calculator.html
│   ├── challenges.html
│   ├── dashboard.html
│   ├── index.html
│   └── leaderboard.html
├── .env.example
├── package.json
└── README.md
```
