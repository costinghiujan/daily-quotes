# Bug Fix Checklist

- [x] Fix 1: Backend `gamificationService.ts` - Add missing `QUOTE_LIKES` case in `evaluateBadges` switch
- [x] Fix 2: Backend `quoteController.ts` - Fix `getQuoteOfTheDay` to use `result.rows.length` instead of `result.rowCount`
- [x] Fix 3: Backend `quoteController.ts` - Parse `quoteId` to int in `getCommentsForQuote`
- [x] Fix 4: Backend `seed.ts` - Fix SQL injection risk with string interpolation in INTERVAL
- [x] Fix 5: Backend `friendshipController.ts` - Add ownership check in `removeFriendOrRequest`
- [x] Fix 6: Frontend `ChatScreen.tsx` - Fix `showAttachmentOptions` nested alert pattern
- [x] Fix 7: Frontend `ChatScreen.tsx` - Fix `handleSendAttachment` DocumentPicker type handling
- [x] Fix 8: Backend `friendshipRoutes.ts` - Fix route ordering to prevent `/:id` from catching `/blocks`
