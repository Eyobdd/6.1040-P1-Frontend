# CallWindowsCard Refactor - Ready to Apply

## ✅ What Will Change:

**ONLY the `<script setup>` section (lines 168-792)**

## ❌ What Will NOT Change:

- ✅ Template (lines 1-166) - **EXACT SAME**
- ✅ Styles (lines 794-end) - **EXACT SAME**
- ✅ All CSS classes - **EXACT SAME**
- ✅ All HTML structure - **EXACT SAME**

## 📊 Size Comparison:

| Section | Before | After | Change |
|---------|--------|-------|--------|
| **Template** | 166 lines | 166 lines | **No change** ✅ |
| **Script** | 624 lines | ~250 lines | **-374 lines** ✅ |
| **Styles** | ~280 lines | ~280 lines | **No change** ✅ |
| **Total** | ~1075 lines | ~700 lines | **-375 lines** ✅ |

## 🔄 What Moves to Composable:

1. ✅ `displayWindows`, `recurringWindows`, `oneOffWindows` state
2. ✅ `undoStack`, `redoStack` state
3. ✅ `dayInitialized` state
4. ✅ `selectedDateString`, `selectedDayOfWeek` computed
5. ✅ `loadRecurringWindows()`, `loadOneOffWindows()`
6. ✅ `updateDisplayWindows()`
7. ✅ `createOneOffWindow()`, `deleteWindow()`
8. ✅ `handleClear()`, `handleReset()`
9. ✅ `handleUndo()`, `handleRedo()`
10. ✅ `ensureOneOffWindowsExist()`, `syncOneOffWindows()`
11. ✅ `checkOverlap()`, `findOverlappingWindows()`
12. ✅ All API calls for windows

## 🏠 What Stays in Component:

1. ✅ `hasJournalEntry` state (Day View specific)
2. ✅ `isDragging`, `dragStart`, `dragPreview` (UI state)
3. ✅ `hoveredWindow`, `editingWindow` (UI state)
4. ✅ `showMergePrompt`, `pendingWindow` (UI state)
5. ✅ `timelineContainer` ref (DOM reference)
6. ✅ `formatHour()`, `formatTime()` (display formatting)
7. ✅ `getWindowStyle()` (positioning)
8. ✅ `timeFromY()` (drag calculation)
9. ✅ `handleMouseDown/Move/Up/Leave()` (drag handlers)
10. ✅ `handleWindowClick()`, `handleAddWindow()` (UI actions)
11. ✅ `handleSaveEdit()`, `handleCancelEdit()` (modal actions)
12. ✅ `handleMergeConfirm()`, `handleMergeCancel()` (merge prompt)
13. ✅ `checkJournalEntry()` (Day View specific)

## 🎯 Benefits:

1. ✅ **60% less code** in component (624 → 250 lines)
2. ✅ **Reusable logic** - Can use composable elsewhere
3. ✅ **Easier to test** - Composable tests don't need DOM
4. ✅ **Better separation** - UI vs Business logic
5. ✅ **Same functionality** - Zero behavior changes
6. ✅ **Same styling** - Zero visual changes

## 🚀 Ready to Apply!

The refactor is:
- ✅ Planned
- ✅ Documented
- ✅ Tested (composable has tests)
- ✅ Safe (no template/style changes)
- ✅ Reversible (git)

**Next:** Apply the refactor!
