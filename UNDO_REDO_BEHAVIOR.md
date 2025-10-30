# Undo/Redo Behavior - After Refactor

## ✅ Expected Behavior:

### Undo Stack:
- **Grows** when you perform actions (create, delete, clear, reset)
- **Shrinks** when you click Undo
- **Cleared** when you change dates
- **Limited** to 10 items (oldest removed)

### Redo Stack:
- **Grows** when you click Undo
- **Shrinks** when you click Redo  
- **Cleared** when you perform a new action
- **Cleared** when you change dates

## 🔄 Workflow Examples:

### Example 1: Create → Undo → Redo
1. **Create window** → Undo stack: [state1], Redo stack: []
2. **Click Undo** → Undo stack: [], Redo stack: [state1]
3. **Click Redo** → Undo stack: [state1], Redo stack: []

### Example 2: Create → Create → Undo → Undo
1. **Create window A** → Undo stack: [state1], Redo stack: []
2. **Create window B** → Undo stack: [state1, state2], Redo stack: []
3. **Click Undo** → Undo stack: [state1], Redo stack: [state2]
4. **Click Undo** → Undo stack: [], Redo stack: [state2, state1]

### Example 3: Create → Undo → Create (Redo cleared)
1. **Create window A** → Undo stack: [state1], Redo stack: []
2. **Click Undo** → Undo stack: [], Redo stack: [state1]
3. **Create window B** → Undo stack: [state2], Redo stack: [] ✅ **Redo cleared!**

### Example 4: Create → Change Date (Both cleared)
1. **Create window** → Undo stack: [state1], Redo stack: []
2. **Change date** → Undo stack: [], Redo stack: [] ✅ **Both cleared!**

## 🐛 Potential Issues:

### Issue 1: Undo/Redo not persisting after action
**Symptom:** Perform action → Undo button enables → Perform another action → Undo stack only has 1 item instead of 2

**Cause:** Undo stack being cleared when it shouldn't be

**Fix:** Check if `pushUndo` is being called correctly and stacks aren't being cleared

### Issue 2: Async timing
**Symptom:** Click Undo → Nothing happens or delayed

**Cause:** Undo/Redo methods are async but handlers weren't awaiting

**Fix:** ✅ **APPLIED** - Made handlers async

## 🔍 Implementation:

### Composable (`useDayCallWindows.ts`):
```typescript
const pushUndo = (action: string) => {
  undoStack.value.push({
    windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
    action,
  });
  redoStack.value = []; // Clear redo on new action
};

const undo = async () => {
  if (undoStack.value.length === 0) return;
  
  redoStack.value.push({
    windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
    action: 'undo',
  });
  
  const lastState = undoStack.value.pop()!;
  oneOffWindows.value = lastState.windows;
  await syncOneOffWindows();
  await updateDisplayWindows();
};

watch(selectedDate, async () => {
  dayInitialized.value = false;
  undoStack.value = []; // Clear on date change
  redoStack.value = []; // Clear on date change
  await loadWindows();
});
```

### Component (`CallWindowsCard.vue`):
```typescript
const handleUndo = async () => await undo();
const handleRedo = async () => await redo();
```

## ✅ Fix Applied:

**Changed:**
```typescript
// Before (synchronous)
const handleUndo = () => undo();
const handleRedo = () => redo();

// After (async)
const handleUndo = async () => await undo();
const handleRedo = async () => await redo();
```

This ensures the async composable methods are properly awaited.

## 🧪 Testing:

To verify undo/redo works correctly:

1. ✅ Create window → Undo button should enable
2. ✅ Create another window → Undo button should still be enabled (2 items in stack)
3. ✅ Click Undo → Last window disappears, Redo button enables
4. ✅ Click Undo again → First window disappears
5. ✅ Click Redo → First window reappears
6. ✅ Click Redo again → Second window reappears
7. ✅ Create new window → Redo button should disable (redo stack cleared)
8. ✅ Change date → Both Undo and Redo should disable (both stacks cleared)

## 📝 Status:

✅ **Fix Applied** - Handlers are now async  
⏳ **Testing Needed** - Verify behavior in browser

If issues persist, please describe the specific behavior you're seeing!
