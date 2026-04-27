# DailyQuotes - Development Roadmap

This roadmap outlines the ongoing development plan for the DailyQuotes application, encompassing visual enhancements, new social features, and critical technical optimizations.

---

## Phase 1: UI/UX & Visual Enhancements

- [ ] **Refined Aesthetics:** Replace standard colors with subtle gradients, pale palettes, and soft fades to create a more premium, modern feel.
- [ ] **Theming:** Fix CSS variables/Theme Context to ensure perfect consistency when toggling between light and dark modes.
- [ ] **Dynamic Interactions:** Add engaging micro-animations for likes and reactions (e.g., using `Reanimated` or `Lottie`).
- [ ] **Component Overhaul:** Upgrade badges and replace native alerts (`Alert.alert`) with custom, beautifully designed confirmation modals for destructive actions (e.g., deleting a post, blocking a user).
- [ ] **Layout Fixes:**
  - Fix any footer rendering issues across scrollable screens.
  - Implement a consistent Top Bar across all pages to accommodate cover photos properly (specifically integrating the `DailyQuotes` header smoothly over images).
- [ ] **Enhanced CTAs:** Redesign primary buttons (e.g., "Follow", "Create Post") to be more distinctive, visually prioritized, and satisfying to press.

---

## Phase 2: Features & Social Logic

- [ ] **Profile Exploration:** Implement robust public/private profile states and the ability to view/add friends directly from other users' profile pages.
- [ ] **Social Interactions:** Enable full reactions on other users' content (Feed, Explore) and integrated friend lists showing mutuals.
- [ ] **Messaging UX:** Link profile pictures in the `ConversationsScreen` and `ChatScreen` to redirect seamlessly to that user's profile.
- [ ] **Post Creation:** Build a new, dedicated "Create Post" screen featuring a live preview of the quote/post styling before submission.
- [ ] **Quote of the Day:** Fix existing bugs regarding the Hof/QotD generation and add background customization (colors/gradients) for the quote card.

---

## Phase 3: Technical Fixes & Optimization

- [ ] **Authentication & Privacy:** Fix the logout bug to ensure notifications or cached data from a previous session are completely wiped and do not persist or bleed into the next account logged into the device.
- [ ] **State Management:** 
  - Fix the "Mark All as Read" logic in Notifications.
  - Ensure real-time WebSocket synchronization for messages and notifications is perfectly stable across app state changes (foreground/background).
- [ ] **I18n Audit:** Conduct a full audit to ensure every single text string across all pages is correctly handled by the `react-i18next` engine (no hardcoded Romanian/English text).
- [ ] **Code Quality:** Refactor components using SOLID principles, ensuring modularity (extracting logic to hooks) and implementing production-ready error handling across the stack.
