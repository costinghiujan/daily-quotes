# Daily Quotes

A full-stack social platform for sharing, discovering, and interacting with quotes. Built with **React Native (Expo)** and **Node.js/Express (TypeScript)**.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) (for PostgreSQL)
- [Expo Go](https://expo.dev/go) app on your phone (optional, for mobile testing)

### 1. Clone & Install

```bash
git clone https://github.com/costinghiujan/daily-quotes.git
cd daily-quotes

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Start the Database

```bash
docker compose up -d
```

This starts PostgreSQL with the pgvector extension on port 5432.

### 3. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at minimum:

```
DB_USER=costin
DB_PASSWORD=costin
JWT_SECRET=your_secure_jwt_secret_key
```

> **Windows users**: Run Docker Desktop, then use the same commands above in PowerShell, Git Bash, or WSL.

### 4. Seed & Start the Backend

```bash
cd backend
npm run db:seed    # Populate database with sample data
npm run dev        # Start dev server at http://localhost:3000
```

### 5. Start the Frontend

```bash
cd frontend
npm start          # Start Expo dev server
```

Then choose how to run the app:

| Command | Platform | Requirements |
|---|---|---|
| Scan QR code with Expo Go | Android / iOS | Phone on same network |
| `npm run android` | Android Emulator | Android Studio |
| `npm run ios` | iOS Simulator | macOS with Xcode |
| `npm run web` | Web browser | Any OS |

## Features

- **Quotes** — Create, share, react (like, love, insightful, bravo), and comment
- **Social** — Friends system, real-time messaging, voice/video calls
- **AI-Powered** — Semantic quote search, mood-based discovery, personalized explore feed (requires [Ollama](https://ollama.ai/))
- **Zen Mode** — Immersive full-screen quotes with ambient audio (rain/lofi) and reflection journaling
- **Gamification** — XP, levels, achievement badges, friend streaks
- **Notifications** — Push notifications with scheduling by time and emotion
- **Multi-language** — English & Romanian
- **Theme** — Light/dark mode

## Project Structure

```
daily-quotes/
├── backend/          # Express + TypeScript API server
│   ├── src/
│   │   ├── config/   # DB, seeding, Swagger, env validation
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/  # Auth, validation, rate limiting, security
│   │   ├── services/    # AI, cron, push notifications, gamification
│   │   └── schemas/     # Zod validation schemas
│   └── .env.example
├── frontend/         # React Native (Expo) mobile app
│   ├── src/
│   │   ├── api/      # Axios service clients
│   │   ├── screens/  # 14 screens (Login, Home, Explore, Zen, etc.)
│   │   ├── components/
│   │   ├── context/  # Auth, Theme, Alert providers
│   │   ├── hooks/
│   │   ├── i18n/     # English & Romanian translations
│   │   └── theme/
│   └── app.json
└── docker-compose.yml
```

## Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Lint with ESLint |
| `npm run db:seed` | Seed database (6 users, 30 quotes, friendships, reactions) |
| `npm run db:clear` | Clear all data |
| `npm run db:vectorize` | Backfill AI embeddings for existing quotes |

### Frontend

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS (macOS only) |
| `npm run web` | Run in web browser |
| `npm test` | Run tests |
| `npm run lint` | Lint with ESLint |

## API Documentation

Once the backend is running, visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) for Swagger UI.

## AI Features (Optional)

1. Install [Ollama](https://ollama.ai/)
2. Pull the models:
   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3
   ```
3. Uncomment `OLLAMA_BASE_URL` in `.env`

## Tech Stack

**Backend:** Node.js, Express, TypeScript, PostgreSQL + pgvector, Socket.io, JWT, Zod, node-cron, Swagger

**Frontend:** React Native, Expo, React Navigation, Axios, i18next, expo-notifications, expo-av

**DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD), EAS Build
