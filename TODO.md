# Daily Quotes - Thesis-Aligned Feature Roadmap

## Legend
- ✅ **Done** — Implemented and working
- 🔧 **In Progress** — Partially implemented
- 📝 **Planned** — Not yet started

---

## 1. Combating the Attention Economy: Doomscrolling vs. "Goodscrolling"

### Core Concept
Replace passive, toxic content consumption with intentional, reflective engagement with quotes, philosophy, and motivation.

### Features
- ✅ **ZenQuoteScreen** — Full-screen immersive quote experience with ambient rain audio, mute toggle, and minimal UI
- ✅ **Quote Reflections** — Users can record how a quote makes them feel (emotion selection + optional note), earning XP for self-awareness
- ✅ **Mood-based quote discovery** — Search quotes by emotional state (mood selector)
- ✅ **Daily quote notifications** — Scheduled push notifications with emotion-based quotes
- ✅ **Streak tracking** — Daily login streaks incentivize healthy habit formation (inspired by Duolingo)
- ✅ **Semantic search toggle** — Users can switch between lexical and AI semantic search, understanding the difference

### Thesis Connection
- **Attention Economy**: The app deliberately avoids infinite scroll, algorithmic feeds optimized for engagement, and variable ratio reinforcement
- **"Goodscrolling"**: Every interaction (reading a quote, reflecting, searching by mood) requires intentionality and reflection
- **Digital Well-being**: The Zen mode with ambient audio creates a calm, focused environment for content consumption

---

## 2. Gamification and Behavioral Engineering

### Core Concept
Use Self-Determination Theory (Competence, Autonomy, Relatedness) and Loss Aversion (streaks) to build healthy habits.

### Features
- ✅ **XP System** — Points awarded for: adding quotes (10 XP), commenting (5 XP), reacting (2 XP), daily login (5 XP), daily prompt (20 XP), reflections (5 XP)
- ✅ **Leveling System** — Level = floor(XP / 50) + 1, displayed on profile with progress bar
- ✅ **Badge System** — Badges for: quotes count, comments count, friends count, quote likes, reactions given, streak milestones
- ✅ **Streak System** — Daily login tracking with streak counter, bonus XP after 7+ consecutive days, streak milestone badges
- ✅ **Leaderboard** — Friends ranked by XP, fostering healthy competition (Relatedness)
- ✅ **Profile Customization** — Avatar, cover photo, bio, full name (Autonomy)
- ✅ **Level-Up Celebration** — Visual feedback when leveling up (Competence)

### Thesis Connection
- **Self-Determination Theory (Ryan & Deci)**:
  - **Competence**: Leveling, badges, XP progress bar
  - **Autonomy**: Profile customization, choosing what to explore
  - **Relatedness**: Friend leaderboard, chat, reactions, comments
- **Loss Aversion (Kahneman)**: Streak system — users return daily to avoid losing their streak
- **BJ Fogg's Behavior Model**: Behavior = Motivation (XP/badges) + Ability (easy daily login) + Prompt (push notifications)

---

## 3. Artificial Intelligence: Semantic Search & Embeddings

### Core Concept
Move beyond keyword matching to semantic understanding using vector embeddings and cosine similarity.

### Features
- ✅ **Ollama Integration** — Local LLM (llama3) for generating quote embeddings
- ✅ **nomic-embed-text** — 768-dimensional embeddings for semantic understanding
- ✅ **pgvector** — PostgreSQL extension for vector storage and similarity search
- ✅ **Semantic Search API** — `/api/quotes/search/semantic` endpoint with configurable threshold
- ✅ **Search UI Toggle** — Users can switch between "Lexical Search" (SQL LIKE) and "AI Semantic Search" (vector similarity)
- ✅ **Mood-based semantic matching** — Quotes matched by emotional context, not just keywords

### Thesis Connection
- **Vector Space Models**: Quotes mapped to 768-dimensional vectors where semantic similarity = cosine distance
- **Sentence-BERT (Reimers & Gurevych, 2019)**: The foundational paper behind embedding-based semantic search
- **Semantic vs. Lexical Search**: The app demonstrates both, allowing users to experience the difference
- **Empathy Engine**: Searching for "loneliness" can return quotes about "finding peace in solitude" — the AI understands context

---

## 4. Social Features & Real-Time Communication

### Core Concept
Foster genuine connection (Relatedness from SDT) through real-time interactions.

### Features
- ✅ **WebSocket-based Chat** — Real-time messaging between friends
- ✅ **Voice/Video Calls** — WebRTC-based audio and video calls
- ✅ **Friend System** — Send/accept/decline friend requests, block/unblock users
- ✅ **Reactions** — Emoji reactions on quotes (BLUE_HEART, etc.)
- ✅ **Comments** — Nested comments on quotes
- ✅ **Push Notifications** — Real-time alerts for friend requests, reactions, comments
- ✅ **Friend Leaderboard** — Competitive ranking among friends

### Thesis Connection
- **Relatedness (SDT)**: The social features fulfill the innate need for connection
- **Positive Reinforcement**: Unlike toxic social media, interactions here are centered around uplifting content

---

## Implementation Status Summary

| Category | Total Features | Implemented | Remaining |
|---|---|---|---|
| Attention Economy / Goodscrolling | 6 | 6 | 0 |
| Gamification & SDT | 7 | 7 | 0 |
| AI & Semantic Search | 6 | 6 | 0 |
| Social & Real-time | 7 | 7 | 0 |
| **Total** | **26** | **26** | **0** |

---

## How to Verify Each Feature

### Backend
```bash
# Start the backend
cd backend && npm run dev

# Test streak tracking
curl -X POST http://localhost:3000/api/users/track-login -H "Authorization: Bearer <token>"

# Test semantic search
curl -X GET "http://localhost:3000/api/quotes/search/semantic?q=loneliness&threshold=0.5" -H "Authorization: Bearer <token>"

# Test leaderboard
curl -X GET http://localhost:3000/api/friendships/leaderboard -H "Authorization: Bearer <token>"

# Test reflections
curl -X POST http://localhost:3000/api/users/reflections -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"quoteId": 1, "emotion": "inspired"}'
```

### Frontend
```bash
cd frontend && npx expo start
```
Then navigate to:
- **Home Screen**: Streak banner at top, daily login tracking
- **Profile**: Level, XP bar, badges, streak info
- **Friends Screen**: Tab between friends list and leaderboard
- **Search**: Toggle between lexical and semantic search
- **Zen Quote**: Reflection panel with emotion selection
- **Explore**: Mood selector, quote of the day
