# CallWindowsCard Refactor - Implementation Plan

## 🎯 Goal
Extract reusable logic from CallWindowsCard while keeping the CSS/styling the same.

## 📦 Architecture

### 1. Reusable Composable: `useCallWindowTimeline.ts` (Already exists!)
**Purpose:** Pure timeline logic - drag, positioning, time formatting

**Already has:**
- Time calculations
- Drag state management
- Window positioning

**Keep as is** - it's already reusable!

---

### 2. NEW Composable: `useDayCallWindows.ts`
**Purpose:** Day-specific window management logic

**Responsibilities:**
- Load recurring and one-off windows
- Day mode management (recurring vs custom)
- Convert recurring to one-off
- CRUD operations for windows
- Undo/Redo stack management
- Overlap detection and merging

**Exports:**
```typescript
export function useDayCallWindows(userId: Ref<string>, selectedDate: Ref<Date>) {
  // State
  const displayWindows = ref<DisplayWindow[]>()
  const recurringWindows = ref<RecurringWindow[]>()
  const oneOffWindows = ref<OneOffWindow[]>()
  const undoStack = ref<UndoState[]>()
  const redoStack = ref<UndoState[]>()
  
  // Computed
  const canUndo = computed(() => ...)
  const canRedo = computed(() => ...)
  const selectedDateString = computed(() => ...)
  const selectedDayOfWeek = computed(() => ...)
  
  // Methods
  const loadWindows = async () => { ... }
  const updateDisplayWindows = async () => { ... }
  const createWindow = async (startTime, endTime) => { ... }
  const deleteWindow = async (window) => { ... }
  const handleClear = async () => { ... }
  const handleReset = async () => { ... }
  const undo = async () => { ... }
  const redo = async () => { ... }
  const checkOverlap = (w1, w2) => { ... }
  const findOverlappingWindows = (window) => { ... }
  
  return {
    // State
    displayWindows,
    undoStack,
    redoStack,
    
    // Computed
    canUndo,
    canRedo,
    
    // Methods
    loadWindows,
    updateDisplayWindows,
    createWindow,
    deleteWindow,
    handleClear,
    handleReset,
    undo,
    redo,
    checkOverlap,
    findOverlappingWindows,
  }
}
```

---

### 3. Refactored Component: `CallWindowsCard.vue`
**Purpose:** Day View wrapper with journal entry checking

**Keeps:**
- All CSS/styling (unchanged!)
- Template structure
- Journal entry overlay
- Day-specific UI (header, buttons)

**Uses:**
- `useDayCallWindows` composable for all logic
- `useCallWindowTimeline` for drag interactions (if needed)

**Simplified structure:**
```vue
<script setup>
import { useDayCallWindows } from '@/composables/useDayCallWindows'

const props = defineProps<{ selectedDate: Date; userId: string }>()

// Use composable for all window logic
const {
  displayWindows,
  canUndo,
  canRedo,
  createWindow,
  deleteWindow,
  handleClear,
  handleReset,
  undo,
  redo,
  loadWindows,
  updateDisplayWindows,
} = useDayCallWindows(toRef(props, 'userId'), toRef(props, 'selectedDate'))

// Day View specific: Journal entry checking
const hasJournalEntry = ref(false)
const checkJournalEntry = async () => { ... }

// Drag handling (delegates to composable)
const handleMouseDown = (e) => { ... }
const handleMouseMove = (e) => { ... }
const handleMouseUp = async (e) => {
  // Get window from drag
  // Call createWindow from composable
}

// Lifecycle
onMounted(async () => {
  await loadWindows()
  await checkJournalEntry()
})

watch(() => props.selectedDate, async () => {
  await loadWindows()
  await checkJournalEntry()
})
</script>

<template>
  <!-- EXACT SAME TEMPLATE - NO CHANGES -->
  <!-- All CSS stays the same -->
</template>

<style scoped>
/* EXACT SAME STYLES - NO CHANGES */
</style>
```

---

## 🔄 Refactor Steps

### Step 1: Create `useDayCallWindows.ts`
Extract all window management logic from CallWindowsCard:
- Window loading
- Day mode management
- CRUD operations
- Undo/Redo
- Clear/Reset
- Overlap detection

### Step 2: Refactor `CallWindowsCard.vue`
- Import and use `useDayCallWindows`
- Keep all template/CSS unchanged
- Delegate all logic to composable
- Keep only Day View specific code (journal entry)

### Step 3: Test
- Verify all functionality works
- Verify styling is unchanged
- Test all user workflows

### Step 4: Reuse!
Now `useDayCallWindows` can be used in:
- ScheduleView (for weekly recurring windows)
- Any other component that needs window management

---

## ✅ Benefits

### For CallWindowsCard:
- ✅ Much smaller component (~300 lines → ~150 lines)
- ✅ Easier to understand
- ✅ Focuses on Day View concerns
- ✅ **All styling stays the same!**

### For Reusability:
- ✅ `useDayCallWindows` can be used anywhere
- ✅ Clean separation of concerns
- ✅ Easier to test
- ✅ Consistent behavior across app

### For Maintenance:
- ✅ Logic changes in one place
- ✅ UI changes in component
- ✅ Clear boundaries

---

## 📋 What Stays in CallWindowsCard

**Template:**
- ✅ Completed overlay
- ✅ Header with title and buttons
- ✅ Timeline grid
- ✅ Call windows display
- ✅ Modals (edit, merge)

**CSS:**
- ✅ All styling unchanged
- ✅ Card layout
- ✅ Timeline styling
- ✅ Window styling
- ✅ Button styling
- ✅ Overlay styling

**Day View Logic:**
- ✅ Journal entry checking
- ✅ Completed overlay display
- ✅ Date navigation handling

---

## 📋 What Moves to Composable

**State Management:**
- ✅ displayWindows
- ✅ recurringWindows
- ✅ oneOffWindows
- ✅ undoStack / redoStack
- ✅ dayInitialized

**Window Operations:**
- ✅ loadWindows
- ✅ createWindow
- ✅ deleteWindow
- ✅ updateDisplayWindows

**Day Mode:**
- ✅ Check mode
- ✅ Switch modes
- ✅ Convert recurring to one-off

**Actions:**
- ✅ Clear
- ✅ Reset
- ✅ Undo
- ✅ Redo

**Utilities:**
- ✅ Overlap detection
- ✅ Date formatting
- ✅ Time calculations

---

## 🚀 Implementation Order

1. ✅ Create `useDayCallWindows.ts` composable
2. ✅ Test composable in isolation
3. ✅ Refactor `CallWindowsCard.vue` to use it
4. ✅ Verify all functionality works
5. ✅ Verify all styling unchanged
6. ✅ Update tests
7. ✅ Document usage

---

**Ready to implement?** This will make the code much cleaner while keeping all your styling intact! 🎨
