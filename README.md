# 🍳 SmartCook Backend API

RESTful API and Realtime WebSocket Gateway for the **SmartCook** intelligent culinary ecosystem (Mobile & Web).

---

## 🌟 Key Features

- **🔐 Authentication & User Roles**: JWT-based authentication (Access & Refresh tokens), Google OAuth2, role-based access control (`user`, `chef`, `admin`), and onboarding flavor profile survey.
- **📖 Recipe Management & Meal Planner**: Rich recipes with nutrition facts, smart filtering, step-by-step cooking timers, favorites, and weekly meal planning.
- **🤖 Gemini AI Integration**: Multi-modal ingredient recognition, dish suggestion from fridge photos, and smart cooking assistant bot.
- **🧊 Smart Fridge & Expiry Tracking**: Real-time ingredient stock management, category expiration alerts, and auto-sync with meal plans.
- **💬 Realtime Community & Chat**: 
  - Dual routing `/api/v1/posts` and `/api/v1/community/posts`
  - 1-1 Direct Messenger via Socket.io
  - Public culinary chat rooms with typing indicators
  - Interactive likes, comments, and gamified Chef XP rewards
- **🔔 Realtime Notifications**:
  - Live WebSocket notifications (`new_notification`) for likes, comments, incoming chat messages, and ingredient expiry reminders.
- **🎁 Daily Rewards & Check-in**:
  - Consecutive check-in streak tracking, XP awards, and claimable supermarket vouchers.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js v20+ with TypeScript
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Realtime**: Socket.io WebSocket Gateway
- **AI Engine**: Google GenAI SDK (Gemini Models)
- **Cloud Storage**: Cloudinary Media Storage

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.

---

## 👥 Contributors

- **DinhLoii** ([@DinhLoii](https://github.com/DinhLoii)) - Lead Developer
- **haai-haj** ([@haai-haj](https://github.com/haai-haj)) - Co-Author & Contributor

---
*SmartCook © 2026 - All Rights Reserved.*
