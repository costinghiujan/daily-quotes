# Daily Quotes - Social Platform for Quotes Sharing

## 📋 Project Overview

Daily Quotes is a full-stack social media application built with **React Native (Expo)** for the frontend and **Node.js/Express with TypeScript** for the backend. The platform allows users to share, discover, and interact with quotes, build friendships, send messages, and earn achievements through a gamification system.

## 🛠️ Tech Stack

### Backend

| Category | Technology | Version |
|---|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) | v18+ |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | ^5.9.3 |
| **Framework** | [Express.js](https://expressjs.com/) | ^5.2.1 |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | 15 (via `pgvector/pgvector:pg15`) |
| **Vector Extension** | [pgvector](https://github.com/pgvector/pgvector) | — |
| **Database Driver** | [node-postgres (pg)](https://node-postgres.com/) | ^8.20.0 |
| **Real-time** | [Socket.io](https://socket.io/) | ^4.8.3 |
| **Authentication** | [JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken) | ^9.0.3 |
| **Password Hashing** | [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | ^6.0.0 |
| **File Upload** | [Multer](https://github.com/expressjs/multer) | ^2.1.1 |
| **Push Notifications** | [expo-server-sdk](https://github.com/expo/expo-server-sdk) | ^6.1.0 |
| **Scheduled Tasks** | [node-cron](https://github.com/node-cron/node-cron) | ^4.2.1 |
| **AI/ML** | [Ollama](https://ollama.ai/) (nomic-embed-text & llama3 models) | — |
| **CORS** | [cors](https://github.com/expressjs/cors) | ^2.8.6 |
| **Environment Variables** | [dotenv](https://github.com/motdotla/dotenv) | ^17.4.2 |
| **Dev Server** | [ts-node-dev](https://github.com/wclr/ts-node-dev) | ^2.0.0 |
| **Linting** | [ESLint](https://eslint.org/) | ^10.2.1 |
| **Formatting** | [Prettier](https://prettier.io/) | ^3.8.3 |
| **TypeScript Config** | [typescript-eslint](https://typescript-eslint.io/) | ^8.57.2 |

### Frontend

| Category | Technology | Version |
|---|---|---|
| **Framework** | [React Native](https://reactnative.dev/) | 0.81.5 |
| **Platform** | [Expo](https://expo.dev/) | ~54.0.33 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | ~5.9.2 |
| **UI Language** | [React](https://react.dev/) | 19.1.0 |
| **Navigation** | [React Navigation](https://reactnavigation.org/) | ^7.x |
| | ├── `@react-navigation/native` | ^7.1.31 |
| | ├── `@react-navigation/native-stack` | ^7.14.2 |
| | └── `@react-navigation/bottom-tabs` | ^7.15.3 |
| **HTTP Client** | [Axios](https://axios-http.com/) | ^1.13.5 |
| **Real-time** | [socket.io-client](https://socket.io/) | ^4.8.3 |
| **Local Storage** | [AsyncStorage](https://github.com/react-native-async-storage/async-storage) | 2.2.0 |
| **Push Notifications** | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | ~0.32.16 |
| **Internationalization** | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) | ^26.0.8 / ^17.0.4 |
| **Device Info** | [expo-device](https://docs.expo.dev/versions/latest/sdk/device/) | ~8.0.10 |
| **Constants** | [expo-constants](https://docs.expo.dev/versions/latest/sdk/constants/) | ~18.0.13 |
| **Image Picker** | [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | ~17.0.10 |
| **Document Picker** | [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/) | ~14.0.8 |
| **Fonts** | [expo-font](https://docs.expo.dev/versions/latest/sdk/font/) | ~14.0.11 |
| **Linear Gradient** | [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | ~15.0.8 |
| **Localization** | [expo-localization](https://docs.expo.dev/versions/latest/sdk/localization/) | ~17.0.8 |
| **Status Bar** | [expo-status-bar](https://docs.expo.dev/versions/latest/sdk/status-bar/) | ~3.0.9 |
| **Icons** | [@expo/vector-icons](https://docs.expo.dev/guides/icons/) (Ionicons) | ^15.0.3 |
| **Safe Area** | [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | ~5.6.0 |
| **Screens** | [react-native-screens](https://github.com/software-mansion/react-native-screens) | ~4.16.0 |
| **Web Support** | [react-native-web](https://necolas.github.io/react-native-web/) | ^0.21.0 |
| **Dev Client** | [expo-dev-client](https://docs.expo.dev/develop/development-builds/introduction/) | ~6.0.20 |
| **Linting** | [ESLint](https://eslint.org/) (expo-config) | ^9.0.0 |
| **Formatting** | [Prettier](https://prettier.io/) | ^3.8.1 |

### Infrastructure & DevOps

| Category | Technology | Version |
|---|---|---|
| **Containerization** | [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) | — |
| **Database Image** | [pgvector/pgvector](https://hub.docker.com/r/pgvector/pgvector) | pg15 |
| **Build Service** | [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services) | — |
| **Push Notifications** | [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) (via `google-services.json`) | — |

### AI Integration (Ollama)

| Model | Purpose |
|---|---|
| **nomic-embed-text** | Generating 768-dimensional vector embeddings for semantic quote search |
| **llama3** | Automatic hashtag/category generation for quotes |

## 🏗️ Architecture

### Backend (Node.js + Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with pgvector extension for AI embeddings
- **Real-time Communication**: Socket.io for WebSocket connections
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Upload**: Multer for handling media uploads
- **Push Notifications**: Expo Push Notifications service
- **AI Integration**: Ollama for quote embeddings and categorization
- **Cron Jobs**: Node-cron for scheduled tasks (nightly maintenance, etc.)

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: React Context API (AuthContext, ThemeContext, AlertContext)
- **HTTP Client**: Axios for API communication
- **Real-time**: Socket.io-client for WebSocket connections
- **Push Notifications**: Expo Notifications
- **Storage**: AsyncStorage for local data persistence
- **UI Components**: Expo Vector Icons (Ionicons), React Native components
- **Internationalization**: i18next with react-i18next (English & Romanian)

### Database Schema
The application uses PostgreSQL with the following main tables:
- `users` - User profiles, XP, levels, and push tokens
- `quotes` - Quotes with AI embeddings (vector 768)
- `friendships` - Friend relationships with streak tracking
- `messages` - Direct messages with media support
- `quote_reactions` - Reactions to quotes (likes, etc.)
- `comments` - Comments on quotes
- `notifications` - System notifications
- `badges` & `user_badges` - Gamification badges
- `blocks` - User blocking system
- `sessions` - Active user sessions

## 📁 Project Structure

### Root Directory
```
daily-quotes/
├── backend/                 # Backend server
├── frontend/               # React Native mobile app
├── docker-compose.yml      # Docker configuration for PostgreSQL
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

### Backend Structure (`backend/`)
```
backend/
├── src/
│   ├── index.ts           # Main server entry point with WebSocket setup
│   ├── config/
│   │   ├── db.ts          # Database connection and schema initialization
│   │   ├── seed.ts        # Database seeding with external quotes API
│   │   ├── clearDB.ts     # Database cleanup utility
│   │   └── backfillEmbeddings.ts # AI embedding backfill script
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── quoteController.ts
│   │   ├── userController.ts
│   │   ├── friendshipController.ts
│   │   ├── messageController.ts
│   │   ├── notificationController.ts
│   │   ├── reactionController.ts
│   │   └── sessionController.ts
│   ├── routes/           # Express route definitions
│   │   ├── authRoutes.ts
│   │   ├── quoteRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── friendshipRoutes.ts
│   │   ├── messageRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── sessionRoutes.ts
│   ├── middleware/       # Custom middleware
│   │   ├── authMiddleware.ts # JWT authentication
│   │   └── uploadMiddleware.ts # File upload handling
│   ├── services/        # Business logic services
│   │   ├── aiService.ts      # AI/ML integration (Ollama)
│   │   ├── cronService.ts    # Scheduled tasks
│   │   ├── expoPushService.ts # Push notification service
│   │   └── gamificationService.ts # XP, levels, badges
│   ├── utils/           # Utility functions
│   │   └── notificationHelper.ts # Notification helpers
│   └── models/          # Data models (currently only Quote.ts)
│       └── Quote.ts
├── uploads/             # Uploaded media files
├── package.json         # Backend dependencies
├── tsconfig.json       # TypeScript configuration
├── .env               # Environment variables
├── .prettierrc        # Code formatting
└── eslint.config.mts  # ESLint configuration
```

### Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── api/            # API service clients
│   │   ├── client.ts           # Axios instance with interceptors
│   │   ├── authService.ts      # Authentication API
│   │   ├── quoteService.ts     # Quotes API
│   │   ├── userService.ts      # User profile API
│   │   ├── friendshipService.ts # Friends API
│   │   ├── messageService.ts   # Messages API
│   │   ├── notificationService.ts # Notifications API
│   │   └── sessionService.ts   # Sessions API
│   ├── screens/        # React Native screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx      # Main feed
│   │   ├── SearchScreen.tsx
│   │   ├── ExploreScreen.tsx   # Discover quotes
│   │   ├── NotificationsScreen.tsx
│   │   ├── ConversationsScreen.tsx # Messages list
│   │   ├── ChatScreen.tsx      # Individual chat
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── FriendsScreen.tsx
│   │   ├── BlockedUsersScreen.tsx
│   │   └── CommentsScreen.tsx  # Quote comments
│   ├── context/       # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── ThemeContext.tsx    # Theme management (light/dark)
│   ├── theme/         # Styling
│   │   ├── colors.ts          # Color palette
│   │   └── appStyles.ts       # Common styles
│   ├── types/         # TypeScript type definitions
│   │   └── Quote.ts          # Quote type interface
│   └── utils/         # Utilities
│       └── storage.ts         # AsyncStorage wrapper
├── assets/            # App assets (icons, images)
├── App.tsx           # Main app component with navigation
├── index.ts          # App entry point
├── package.json      # Frontend dependencies
├── tsconfig.json    # TypeScript configuration
├── app.json         # Expo configuration
├── eas.json         # EAS build configuration
├── google-services.json # Firebase configuration
├── .prettierrc      # Code formatting
└── eslint.config.js # ESLint configuration
```

## 🚀 Features

### Core Features
1. **User Authentication** - Register, login, JWT-based sessions
2. **Quote Management** - Create, read, update, delete quotes
3. **Social Interactions** - Like, comment on quotes
4. **Friends System** - Send/accept friend requests, manage friends list
5. **Direct Messaging** - Real-time chat with media sharing (images, documents)
6. **Notifications** - Push notifications for interactions
7. **User Profiles** - Customizable profiles with avatars
8. **Blocking System** - Block/unblock users

### Advanced Features
1. **AI Integration** - Automatic quote categorization and embeddings using Ollama
2. **Gamification** - XP system, levels, and achievement badges
3. **Search & Discovery** - Search quotes by text, author, or category
4. **Explore Feed** - AI-powered quote recommendations
5. **Quote of the Day** - Daily featured quote
6. **Streak Tracking** - Friend interaction streaks
7. **Multi-device Sessions** - Manage active sessions across devices
8. **Theme Support** - Light/dark mode

### Technical Features
1. **Real-time Updates** - WebSocket connections for instant messaging
2. **Push Notifications** - Expo Push Notifications for mobile
3. **File Upload** - Profile pictures and chat media
4. **Database Migrations** - Automatic schema updates
5. **Cron Jobs** - Automated maintenance tasks
6. **Vector Search** - AI-powered semantic search using pgvector

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)
- Docker & Docker Compose (optional)
- Expo CLI (for frontend development)
- Ollama (for AI features - optional)

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (copy `.env.example` to `.env` if available):
   ```bash
   cp .env.example .env  # Or create .env manually
   ```
   Required environment variables:
   ```
   PORT=3000
   DB_USER=costin
   DB_PASSWORD=costin
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=daily_quotes_postgres_db
   JWT_SECRET=your_jwt_secret_here
   ```

4. Start PostgreSQL database (using Docker):
   ```bash
   docker-compose up -d
   ```

5. Initialize database:
   ```bash
   npm run db:seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Expo development server:
   ```bash
   npm start
   ```

4. Use Expo Go app on your mobile device or run on emulator:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS (macOS only)
   npm run web      # For web browser
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Quotes
- `GET /api/quotes` - Get quotes (with pagination/filters)
- `GET /api/quotes/:id` - Get specific quote
- `POST /api/quotes` - Create new quote
- `PUT /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Delete quote
- `GET /api/quotes/feed` - Get personalized feed
- `GET /api/quotes/explore` - Get explore feed (AI recommendations)
- `GET /api/quotes/daily` - Get quote of the day
- `POST /api/quotes/:id/comments` - Add comment to quote
- `GET /api/quotes/:id/comments` - Get quote comments

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/avatar` - Upload profile picture

### Friendships
- `POST /api/friendships/request` - Send friend request
- `POST /api/friendships/accept` - Accept friend request
- `DELETE /api/friendships/:id` - Remove friend/reject request
- `GET /api/friendships/requests` - Get pending requests
- `GET /api/friendships/friends` - Get friends list
- `POST /api/friendships/block` - Block user
- `DELETE /api/friendships/block` - Unblock user
- `GET /api/friendships/blocked` - Get blocked users
- `GET /api/friendships/status/:userId` - Check relationship status

### Messages
- `GET /api/messages/conversations` - Get conversations list
- `GET /api/messages/:userId` - Get chat history with user
- `POST /api/messages/upload` - Upload chat attachment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/push-token` - Save push token

### Sessions
- `GET /api/sessions` - Get active sessions
- `DELETE /api/sessions/:id` - Revoke session

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test  # If test scripts are configured
```

### Database Utilities
```bash
# Clear database (development only)
npm run db:clear

# Seed database with sample data
npm run db:seed

# Backfill AI embeddings for existing quotes
npm run db:vectorize
```

## 🐳 Docker Deployment

The project includes Docker Compose configuration for PostgreSQL:

```bash
# Start PostgreSQL with pgvector
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## 🔐 Security Features

1. **JWT Authentication** - Token-based authentication with expiration
2. **Password Hashing** - bcrypt for secure password storage
3. **CORS Configuration** - Controlled API access
4. **Input Validation** - Server-side validation
5. **SQL Injection Prevention** - Parameterized queries
6. **File Upload Security** - Type and size restrictions
7. **Rate Limiting** - (To be implemented)
8. **HTTPS Enforcement** - (Production requirement)

## 📱 Mobile App Features

### Screens
1. **Login/Register** - User authentication
2. **Home Feed** - Personalized quote feed
3. **Search** - Find quotes and users
4. **Explore** - Discover new quotes (AI-powered)
5. **Notifications** - Activity notifications
6. **Messages** - Direct messaging
7. **Profile** - User profile and settings
8. **Friends** - Manage friends list
9. **Blocked Users** - Manage blocked users
10. **Settings** - App preferences
11. **Comments** - View and add comments
12. **Chat** - Individual conversation

### Mobile-Specific Features
- Push notifications
- Camera/image picker integration
- Document picker for file sharing
- Adaptive icons and splash screens
- Platform-specific UI adjustments
- Offline support (partial)

## 🤖 AI Integration

The application uses Ollama for AI features:

1. **Quote Embeddings** - Convert quotes to vector representations
2. **Semantic Search** - Find similar quotes using vector similarity
3. **Automatic Categorization** - AI-generated hashtags/categories
4. **Recommendations** - Personalized quote suggestions

To enable AI features:
1. Install Ollama: https://ollama.ai/
2. Pull required model: `ollama pull nomic-embed-text`
3. Ensure Ollama is running on default port (11434)

## 🎮 Gamification System

### XP & Levels
- Users earn XP for various activities (posting quotes, getting reactions, etc.)
- Level progression based on XP thresholds
- Visual level indicators in user profiles

### Badges
- **Scriitor Începător** - Post first 5 quotes
- **Social Butterfly** - Collect 10 friends
- **Critic Literar** - Leave 10 comments
- **Trendsetter** - Get 50 likes on a quote

### Streaks
- Friend interaction streaks
- Daily engagement incentives

## 🔄 Real-time Features

### WebSocket Events
- `join_own_room` - Join user-specific room
- `send_message` - Send real-time message
- `receive_message` - Receive incoming message
- `message_error` - Message delivery errors

### Real-time Updates
- Instant message delivery
- Online status indicators (to be implemented)
- Live notification updates

## 🚨 Error Handling

The application implements comprehensive error handling:

1. **Server-side** - Structured error responses with status codes
2. **Client-side** - User-friendly error messages
3. **Logging** - Console logging with error categorization
4. **Fallbacks** - Graceful degradation for optional features (AI, push notifications)

## 📈 Performance Optimizations

1. **Database Indexing** - Optimized queries with appropriate indexes
2. **Pagination** - Limit results for large datasets
3. **Caching** - (To be implemented)
4. **Lazy Loading** - On-demand data loading
5. **Image Optimization** - Compressed uploads

## 🔧 Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:seed      # Seed database
npm run db:clear     # Clear database
npm run db:vectorize # Backfill AI embeddings
```

### Frontend
```bash
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```