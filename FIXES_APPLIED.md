# Fixes Applied Before Refactor

## ✅ Issue 1: Import Error Fixed
**Problem:** `SyntaxError: The requested module '/node_modules/.vite/deps/vue.js?v=8ed8e03b' does not provide an export named 'Ref'`

**Location:** `/src/composables/useCallWindowTimeline.ts:1`

**Fix:**
```typescript
// Before
import { ref, computed, Ref } from 'vue';

// After
import { ref, computed, type Ref } from 'vue';
```

**Explanation:** Changed to type-only import for `Ref` to avoid runtime import issues.

---

## ✅ Issue 2: Merge with Recurring Windows Fixed
**Problem:** Merge doesn't work when user overlaps with a recurring call window

**Location:** `/src/components/CallWindowsCard.vue` - `handleMouseUp` function

**Fix:**
```typescript
if (overlapping.length > 0) {
  // If overlapping with recurring windows, convert them to one-off first
  const hasRecurringOverlap = overlapping.some(w => w.type === undefined || w.isRecurringDefault);
  if (hasRecurringOverlap) {
    await ensureOneOffWindowsExist();
    // Refresh display to show converted windows
    updateDisplayWindows();
  }
  
  // Show merge prompt
  pendingWindow.value = { startTime: window.startTime, endTime: window.endTime };
  showMergePrompt.value = true;
}
```

**Explanation:** 
- Detects if overlapping windows include recurring windows
- Converts recurring windows to one-off before showing merge prompt
- Ensures merge API can work with actual one-off windows

---

## ✅ Issue 3: Clear Behavior Fixed
**Problem:** Clear should convert all recurring windows to one-off for that day, then delete them

**Location:** `/src/components/CallWindowsCard.vue` - `handleClear` function

**Fix:**
```typescript
const handleClear = async () => {
  // CLEAR: Remove ALL windows for this day (convert recurring to one-off first, then delete all)
  pushUndo('clear');
  
  // First, ensure recurring windows are converted to one-off for this date
  await ensureOneOffWindowsExist();
  
  // Now delete all one-off windows for this date from backend
  const windowsToDelete = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  
  for (const window of windowsToDelete) {
    await api.deleteOneOffCallWindow(
      props.userId,
      selectedDateString.value,
      new Date(window.startTime)
    );
  }
  
  // Clear all windows for this date from local state
  oneOffWindows.value = oneOffWindows.value.filter(
    w => w.specificDate !== selectedDateString.value
  );
  
  // Keep initialized flag true - day has been edited and cleared
  // This prevents recurring windows from showing again
  dayInitialized.value = true;
  
  updateDisplayWindows();
};
```

**Behavior:**
1. Converts all recurring windows for this day to one-off windows
2. Deletes all one-off windows (including the converted ones)
3. Marks day as initialized so recurring windows don't reappear
4. Result: Day is completely clear of all windows

---

## ✅ Issue 4: Reset Behavior Clarified
**Problem:** Need to clarify that Reset removes one-off windows and shows recurring windows

**Location:** `/src/components/CallWindowsCard.vue` - `handleReset` function

**Fix:**
```typescript
const handleReset = async () => {
  // RESET: Remove all one-off windows for this day and show recurring windows again
  pushUndo('reset');
  
  // Delete all one-off windows for this date from backend
  const windowsToDelete = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  
  for (const window of windowsToDelete) {
    await api.deleteOneOffCallWindow(
      props.userId,
      selectedDateString.value,
      new Date(window.startTime)
    );
  }
  
  // Clear all one-off windows for this date from local state
  oneOffWindows.value = oneOffWindows.value.filter(
    w => w.specificDate !== selectedDateString.value
  );
  
  // Mark as uninitialized so recurring windows show again
  dayInitialized.value = false;
  
  updateDisplayWindows();
};
```

**Behavior:**
1. Deletes all one-off windows for this day
2. Marks day as uninitialized
3. Recurring windows reappear as defaults
4. Result: Day returns to weekly recurring schedule

---

## Summary of Behaviors

### Reset vs Clear

| Action | Recurring Windows | One-Off Windows | Day Initialized | Result |
|--------|------------------|-----------------|-----------------|---------|
| **Reset** | Kept (shown as defaults) | Deleted | `false` | Returns to weekly schedule |
| **Clear** | Converted to one-off, then deleted | Deleted | `true` | Day completely clear |

### User Workflows

**Scenario 1: User wants to return to weekly schedule**
- Action: Click "Reset"
- Result: All custom windows removed, recurring windows show again

**Scenario 2: User wants a completely free day**
- Action: Click "Clear"
- Result: All windows removed (including recurring), day stays clear

**Scenario 3: User creates overlapping window with recurring**
- Before fix: Merge prompt shows but merge fails
- After fix: Recurring converts to one-off automatically, then merge works

---

## Testing Checklist

- [x] Import error resolved (no console errors on load)
- [x] Clear converts recurring to one-off before deleting
- [x] Clear results in completely empty day
- [x] Reset removes one-off and shows recurring
- [x] Merge works when overlapping with recurring windows
- [x] Recurring windows auto-convert before merge

---

**Status:** ✅ **ALL FIXES APPLIED - READY FOR REFACTOR**
