# Project Audit & Fix Checklist

## ✅ Completed
- [x] SearchScreen: Added gradient top bar with consistent styling
- [x] BlockedUsersScreen: Added gradient top bar with consistent styling
- [x] Fix AuthContext.tsx: Skip 401 handling for `/auth/logout` endpoint
- [x] Fix: Clear expo push token on logout to prevent notifications from previous session bleeding into next account
- [x] Fix NotificationsScreen: The `handleMarkAllRead` should not show an alert on success (UX issue)
- [x] Fix: Optimistic update should be more robust
- [x] Add missing `profile.quotes` key to ro.json
- [x] Add missing `settings.connectedDevices` key to en.json and ro.json
- [x] Add missing `settings.settingSaveFailed` key to en.json and ro.json
- [x] Fix `settings.cancel` -> should use `common.cancel` instead
- [x] Fix logout to clear push token on backend

## 🔴 Critical Bugs to Fix

### Logout Bug (Session Bleed)
- [x] Fix AuthContext.tsx: The 401 interceptor can cause infinite loop when logout API call itself gets 401
- [x] Fix: Skip 401 handling for `/auth/logout` endpoint
- [x] Fix: Clear expo push token on logout to prevent notifications from previous session bleeding into next account

### Mark All as Read Logic
- [x] Fix NotificationsScreen: The `handleMarkAllRead` should not show an alert on success (UX issue)
- [x] Fix: Optimistic update should be more robust

## 🎨 UI/UX & Visual Enhancements

### Refined Aesthetics
- [ ] Add subtle gradient backgrounds to remaining screens (Login, Register, Friends, Explore, Conversations, Chat)
- [ ] Ensure consistent top bar across all pages

### Theming
- [ ] Verify all CSS variables are properly used in dark mode
- [ ] Fix any hardcoded colors

### Dynamic Interactions
- [ ] Add micro-animations for like/reaction buttons (already done in HomeScreen - verify)
- [ ] Add loading skeletons for list screens

### Component Overhaul
- [ ] Upgrade badges with gradient styling
- [ ] Ensure CustomAlert is used everywhere (no native alerts)

### Layout Fixes
- [ ] Fix footer rendering issues
- [ ] Implement consistent Top Bar across all pages

### Enhanced CTAs
- [ ] Redesign primary buttons with gradient backgrounds

## 🌐 i18n Audit
- [x] Add missing `profile.quotes` key to en.json and ro.json
- [x] Add missing `settings.connectedDevices` key to en.json and ro.json
- [x] Add missing `settings.settingSaveFailed` key to en.json and ro.json
- [x] Fix `settings.cancel` -> should use `common.cancel` instead

## 🔧 Technical Fixes

### Authentication & Privacy
- [x] Fix logout to clear push token on backend
- [x] Ensure notifications don't persist between sessions

### State Management
- [ ] Fix real-time sync for messages and notifications

### Code Quality
- [ ] Refactor components using SOLID principles
- [ ] Add proper error boundaries
- [ ] Fix any TypeScript errors
