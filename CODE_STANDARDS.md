# DailyQuotes - Architecture & Code Best Practices

This document serves as the single source of truth for the project's coding standards, architectural patterns, and professional best practices. By following these guidelines, you ensure the codebase remains clean, scalable, maintainable, and easy to navigate for any developer.

---

## 1. Project Architecture & Structure

A professional project relies on a strict separation of concerns. The directory structure should reflect the purpose of each file without ambiguity.

### Frontend (React Native / Expo)
Keep the `src/` directory highly modularized:
- `src/screens/`: Contains top-level views (e.g., `HomeScreen.tsx`). **Rule:** Screens should contain minimal business logic and mostly handle UI composition and routing.
- `src/components/`: Reusable UI elements (e.g., `CustomButton.tsx`, `QuoteCard.tsx`). Must be generic and not tied to specific screen logic.
- `src/context/`: Global state management (e.g., `AuthContext.tsx`, `ThemeContext.tsx`).
- `src/hooks/`: Custom React hooks (e.g., `useFetchQuotes.ts`). **Rule:** Move complex state and API fetching logic from screens into custom hooks.
- `src/api/`: Centralized network requests and service classes (e.g., `quoteService.ts`). Never make raw `fetch` or `axios` calls inside components.
- `src/theme/`: Global styling, color palettes, and typography tokens.
- `src/types/`: Shared TypeScript interfaces and types.
- `src/utils/`: Pure helper functions (e.g., date formatting, validation).

### Backend (Node.js / Express)
Adopt a **Layered Architecture** (Controller-Service-Model):
- `src/routes/`: Defines HTTP endpoints and maps them to controllers.
- `src/controllers/`: Handles HTTP requests/responses, validates input, and calls services. **Rule:** No business logic belongs here.
- `src/services/`: Contains the core business logic. This layer interacts with the database models.
- `src/models/`: Database schemas and database interaction logic.
- `src/middlewares/`: Express middlewares (e.g., authentication, error handling).

---

## 2. React Native & Frontend Best Practices

### A. Separation of Logic and UI
Instead of writing 300-line components with `useEffect` and data fetching, extract logic into custom hooks.
**Bad:**
```tsx
const ProfileScreen = () => {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/user').then(...) }, []);
  return <View>...</View>;
}
```
**Good:**
```tsx
const ProfileScreen = () => {
  const { data, isLoading } = useUserProfile();
  return <View>...</View>;
}
```

### B. Performance Optimization
- **Memoization:** Use `useMemo` for expensive calculations and `useCallback` for functions passed as props to child components to prevent unnecessary re-renders.
- **FlatList Rules:** Always provide `keyExtractor`, use `initialNumToRender`, and extract `renderItem` into an external or `useCallback` wrapped function.

### C. Styling and Theming
- Avoid inline styles or hardcoded hex colors.
- Always use the centralized `ThemeContext` or a design token system.
- Extract `StyleSheet.create` logic outside the component to prevent recreating objects on every render, or memoize it if it depends on dynamic themes.

---

## 3. TypeScript Rules

### A. Strict Typing
- **Never use `any`.** If the type is unknown, use `unknown` and assert it, or define a proper generic.
- Rely on explicit interfaces for API payloads and database models.

### B. Union Types over Booleans
When a state has multiple phases, use Union Types instead of multiple booleans.
**Bad:**
```ts
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
```
**Good:**
```ts
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
```

---

## 4. General Clean Code Principles

### A. Early Returns (Guard Clauses)
Avoid deep nesting by returning early if conditions aren't met.
**Bad:**
```ts
function processUser(user) {
  if (user) {
    if (user.isActive) {
       // logic
    }
  }
}
```
**Good:**
```ts
function processUser(user) {
  if (!user || !user.isActive) return;
  // logic
}
```

### B. Naming Conventions
- **Variables/Functions:** `camelCase` (e.g., `fetchQuotes`, `userData`).
- **Components/Interfaces:** `PascalCase` (e.g., `HomeScreen`, `UserProfile`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`).
- Use descriptive boolean names (`isLoading`, `hasPermission`, `shouldRender`).

### C. Error Handling
- Never leave an empty `catch` block.
- Log errors properly and provide user-friendly fallback UI alerts.
- In the backend, use a global error handling middleware to catch unhandled rejections and return standard JSON formats.

---

## 5. Security & Environment Variables

- Never hardcode API URLs, JWT Secrets, or API Keys in the code.
- Use `.env` files and `expo-constants` for frontend environment variables.
- Keep backend secrets strictly server-side.
- Always validate incoming payload structures in the backend using libraries like `Joi` or `Zod` before processing.

---

## 6. Git Workflow & Version Control

- **Atomic Commits:** Make small, focused commits rather than huge dumps of code.
- **Conventional Commits:** Prefix commit messages with their purpose:
  - `feat: added custom bottom tab navigator`
  - `fix: resolved memory leak in feed scroll`
  - `refactor: extracted notification logic to custom hook`
  - `style: updated primary color to standard blue`
- **Branching:** Work on feature branches (`feature/add-reactions`) and merge them via Pull Requests. 

By enforcing these rules, the team ensures the DailyQuotes platform remains stable, performant, and developer-friendly!
