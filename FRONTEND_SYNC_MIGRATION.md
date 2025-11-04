# Frontend Migration Guide for Backend Syncs

## Overview
The backend now uses synchronizations for authentication. All protected endpoints require a session token, and the user ID is automatically extracted from the token on the backend.

## API Service Changes

### ✅ Updated: `src/services/api.ts`
All authenticated endpoint methods have been updated to:
1. Remove `user` parameter from method signatures
2. Add `token: this.token` to request bodies
3. Keep other parameters unchanged

## Component Updates Required

The following components need to be updated to remove `user` parameter from API calls:

### Profile Components

**Before:**
```typescript
await api.createProfile(user, displayName, phoneNumber, timezone);
await api.getProfile(user);
await api.updateRatingPreference(user, includeRating);
```

**After:**
```typescript
await api.createProfile(displayName, phoneNumber, timezone);
await api.getProfile();
await api.updateRatingPreference(includeRating);
```

### Journal Prompt Components

**Before:**
```typescript
await api.createDefaultPrompts(user);
await api.getUserPrompts(user);
await api.getActivePrompts(user);
await api.updatePromptText(user, position, newText);
await api.reorderPrompts(user, newOrder);
await api.togglePromptActive(user, position);
await api.deletePrompt(user, position);
await api.addPrompt(user, promptText);
```

**After:**
```typescript
await api.createDefaultPrompts();
await api.getUserPrompts();
await api.getActivePrompts();
await api.updatePromptText(position, newText);
await api.reorderPrompts(newOrder);
await api.togglePromptActive(position);
await api.deletePrompt(position);
await api.addPrompt(promptText);
```

### Reflection Session Components

**Before:**
```typescript
await api.startSession(user, callSession, prompts);
await api.recordResponse(session, promptId, promptText, position, responseText);
await api.completeSession(session, expectedPromptCount);
await api.getSessionResponses(session);
await api.getSession(session);
```

**After:**
```typescript
await api.startSession(callSession, prompts);
await api.recordResponse(session, promptId, promptText, position, responseText);
await api.completeSession(session, expectedPromptCount);
await api.getSessionResponses(session);
await api.getSession(session);
```

### Journal Entry Components

**Before:**
```typescript
await api.createFromSession(sessionData, sessionResponses);
await api.getEntriesByUser(user);
await api.getEntriesWithResponsesByUser(user);
await api.getEntryByDate(user, date);
await api.getEntryResponses(entry);
```

**After:**
```typescript
await api.createFromSession(sessionData, sessionResponses);
await api.getEntriesByUser();
await api.getEntriesWithResponsesByUser();
await api.getEntryByDate(date);
await api.getEntryResponses(entry);
```

### Call Window Components

**Before:**
```typescript
await api.createRecurringCallWindow(user, dayOfWeek, startTime, endTime);
await api.createOneOffCallWindow(user, specificDate, startTime, endTime);
await api.deleteRecurringCallWindow(user, dayOfWeek, startTime);
await api.deleteOneOffCallWindow(user, specificDate, startTime);
await api.getUserCallWindows(user);
await api.getUserRecurringWindows(user);
await api.getUserOneOffWindows(user);
await api.getRecurringWindowsByDay(dayOfWeek);
await api.getOneOffWindowsByDate(specificDate);
await api.mergeOverlappingOneOffWindows(user, specificDate, startTime, endTime);
await api.setDayModeCustom(user, date);
await api.setDayModeRecurring(user, date);
await api.shouldUseRecurring(user, date);
```

**After:**
```typescript
await api.createRecurringCallWindow(dayOfWeek, startTime, endTime);
await api.createOneOffCallWindow(specificDate, startTime, endTime);
await api.deleteRecurringCallWindow(dayOfWeek, startTime);
await api.deleteOneOffCallWindow(specificDate, startTime);
await api.getUserCallWindows();
await api.getUserRecurringWindows();
await api.getUserOneOffWindows();
await api.getRecurringWindowsByDay(dayOfWeek);
await api.getOneOffWindowsByDate(specificDate);
await api.mergeOverlappingOneOffWindows(specificDate, startTime, endTime);
await api.setDayModeCustom(date);
await api.setDayModeRecurring(date);
await api.shouldUseRecurring(date);
```

## Files to Update

Search for these patterns in your Vue components and update them:

### 1. Search for API calls with `user` parameter
```bash
# In the frontend directory
grep -r "api\\.createProfile(user" src/
grep -r "api\\.getProfile(user" src/
grep -r "api\\.updateRatingPreference(user" src/
grep -r "api\\.createDefaultPrompts(user" src/
grep -r "api\\.getUserPrompts(user" src/
grep -r "api\\.getActivePrompts(user" src/
grep -r "api\\.updatePromptText(user" src/
grep -r "api\\.reorderPrompts(user" src/
grep -r "api\\.togglePromptActive(user" src/
grep -r "api\\.deletePrompt(user" src/
grep -r "api\\.addPrompt(user" src/
grep -r "api\\.startSession(user" src/
grep -r "api\\.getEntriesByUser(user" src/
grep -r "api\\.getEntriesWithResponsesByUser(user" src/
grep -r "api\\.getEntryByDate(user" src/
grep -r "api\\.createRecurringCallWindow(user" src/
grep -r "api\\.createOneOffCallWindow(user" src/
grep -r "api\\.deleteRecurringCallWindow(user" src/
grep -r "api\\.deleteOneOffCallWindow(user" src/
grep -r "api\\.getUserCallWindows(user" src/
grep -r "api\\.getUserRecurringWindows(user" src/
grep -r "api\\.getUserOneOffWindows(user" src/
grep -r "api\\.mergeOverlappingOneOffWindows(user" src/
grep -r "api\\.setDayModeCustom(user" src/
grep -r "api\\.setDayModeRecurring(user" src/
grep -r "api\\.shouldUseRecurring(user" src/
```

### 2. Likely Components to Update

Based on your app structure, these components likely need updates:

- **Views:**
  - `src/views/TodayView.vue` - Dashboard with call windows and journal entries
  - `src/views/ScheduleView.vue` - Call window scheduling
  - `src/views/JournalView.vue` - Journal entries
  - `src/views/PromptsView.vue` - Journal prompt management
  - `src/views/ProfileView.vue` - Profile management

- **Components:**
  - `src/components/CallWindowsCard.vue` - Call window CRUD
  - `src/components/RecurringWeekScheduler.vue` - Recurring window scheduling
  - Any reflection/journal components

- **Stores:**
  - `src/stores/dashboardStore.ts` - If it makes API calls
  - Any other Pinia stores that interact with the API

## Testing Checklist

### ✅ Public Endpoints (Should Work Without Changes)
- [ ] User registration
- [ ] User login
- [ ] Verification code request

### 🔄 Protected Endpoints (Need Component Updates)
- [ ] Profile creation
- [ ] Profile retrieval
- [ ] Rating preference update
- [ ] Default prompts creation
- [ ] Get user prompts
- [ ] Get active prompts
- [ ] Add/update/delete/reorder prompts
- [ ] Start reflection session
- [ ] Record responses
- [ ] Complete session
- [ ] Get session data
- [ ] Create journal entry
- [ ] Get journal entries
- [ ] Create call windows (recurring and one-off)
- [ ] Delete call windows
- [ ] Get call windows
- [ ] Merge overlapping windows
- [ ] Day mode management

## Migration Steps

1. **Commit current state** - Make sure all changes are committed
2. **Update components** - Remove `user` parameter from all API calls
3. **Test registration/login** - Verify authentication still works
4. **Test each feature** - Go through each protected feature systematically
5. **Check browser console** - Look for any authentication errors
6. **Verify backend logs** - Check that syncs are executing correctly

## Common Issues

### Issue: "User is null" or authentication failures
**Solution:** Ensure the token is being set correctly after login:
```typescript
const result = await api.login(phoneNumber, code);
if (result.token) {
  api.setToken(result.token);
}
```

### Issue: TypeScript errors about missing parameters
**Solution:** Update the component to remove the `user` parameter from the call

### Issue: API returns empty or null data
**Solution:** Check that:
1. User is logged in (token exists)
2. Token hasn't expired
3. Backend syncs are running (check backend console)

## Rollback Plan

If issues arise, you can temporarily:
1. Revert the frontend API service changes
2. Keep the backend running with syncs
3. Fix issues incrementally
4. Re-apply frontend changes

## Next Steps After Migration

1. Test all user journeys end-to-end
2. Verify security (try accessing data without token)
3. Update any documentation
4. Deploy backend and frontend together
5. Monitor for any authentication issues

## Notes

- The backend automatically extracts the user ID from the session token
- All authentication is now enforced at the backend level
- Invalid or missing tokens will result in empty responses or errors
- The Authorization header is still set but not used by syncs (token in body is used)
