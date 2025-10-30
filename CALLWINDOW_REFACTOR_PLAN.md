# CallWindowsCard Refactoring Plan

## 🎯 Objectives

1. **Extract reusable core functionality** for use across the app
2. **Preserve all existing functionality** without regressions
3. **Improve UX** for Reset vs Clear distinction
4. **Add merge confirmation prompt** before merging overlapping windows
5. **Write comprehensive tests** before and after refactoring

---

## 📋 Current Functionality Analysis

### **Core Features (Reusable)**

These features should work for any window management scenario:

1. **Timeline Rendering**
   - 24-hour grid with time labels
   - Hour and quarter-hour lines
   - Scrollable container (700px max-height)
   
2. **Drag-to-Create**
   - Mouse down/move/up handlers
   - Snap to 5-minute intervals
   - Minimum 5-minute duration
   - Preview window during drag
   
3. **Window Display**
   - Calculate position from time
   - Format time ranges (12-hour AM/PM)
   - Hover states
   - Delete button on hover
   
4. **Overlap Detection**
   - Check if two windows overlap
   - Find all overlapping windows
   - Merge overlapping windows
   
5. **Undo/Redo System**
   - Stack-based undo/redo
   - Limit stack to 10 items
   - Clear redo on new action
   
6. **Window Operations**
   - Create window
   - Delete window
   - Edit window (via modal)
   - Clear all windows
   
### **Day View Specific Features**

These features are specific to the Day View use case:

1. **Recurring Window Conversion**
   - Show recurring windows as defaults
   - Convert to one-off on first interaction
   - Track initialization state per day
   
2. **Reset vs Clear**
   - **Reset**: Remove one-off windows, show recurring again
   - **Clear**: Remove all windows, keep day initialized
   
3. **Journal Entry Check**
   - Check if entry exists for date
   - Show "Call Completed" overlay
   - Disable interactions when completed
   
4. **Date Navigation**
   - Watch for date changes
   - Load windows for new date
   - Update display windows
   
5. **"Initiate Call" Action**
   - Empty state with manual call button
   - Only shown for today

---

## 🏗️ Proposed Architecture

### **Layer 1: Composable - `useCallWindowManager`**

**Purpose:** Pure logic for window management

**Responsibilities:**
- Window CRUD operations
- Overlap detection and merging
- Undo/redo stack management
- Time calculations and formatting
- Drag state management

**Exports:**
```typescript
interface UseCallWindowManagerOptions {
  userId: string;
  onWindowsChange?: (windows: Window[]) => void;
  enableUndo?: boolean;
  maxUndoStack?: number;
}

interface UseCallWindowManagerReturn {
  // State
  windows: Ref<Window[]>;
  isDragging: Ref<boolean>;
  previewWindow: Ref<Window | null>;
  undoStack: Ref<UndoState[]>;
  redoStack: Ref<UndoState[]>;
  
  // Computed
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  
  // Operations
  createWindow: (start: Date, end: Date, shouldMerge?: boolean) => Promise<void>;
  deleteWindow: (window: Window) => Promise<void>;
  updateWindow: (window: Window, updates: Partial<Window>) => Promise<void>;
  clearWindows: () => Promise<void>;
  
  // Undo/Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  
  // Overlap
  findOverlapping: (window: Window) => Window[];
  checkOverlap: (w1: Window, w2: Window) => boolean;
  
  // Drag
  startDrag: (y: number, containerTop: number) => void;
  updateDrag: (y: number, containerTop: number) => void;
  endDrag: () => { start: Date; end: Date } | null;
  cancelDrag: () => void;
  
  // Utilities
  formatTime: (date: Date) => string;
  formatHour: (hour: number) => string;
  getWindowStyle: (window: Window) => { top: string; height: string };
}
```

---

### **Layer 2: Component - `CallWindowManager.vue`**

**Purpose:** Reusable timeline UI component

**Props:**
```typescript
interface Props {
  windows: Window[];
  readonly?: boolean;
  showEmptyState?: boolean;
  emptyStateText?: string;
  emptyStateHint?: string;
  enableDrag?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
}
```

**Events:**
```typescript
{
  'window-create': [{ start: Date; end: Date }];
  'window-delete': [Window];
  'window-click': [Window];
  'merge-needed': [{ newWindow: Window; overlapping: Window[] }];
}
```

**Features:**
- Timeline grid rendering
- Drag-to-create (if enabled)
- Window display
- Hover states
- Delete buttons (if enabled)
- Empty state (if enabled)
- Edit modal integration (if enabled)

---

### **Layer 3: Wrapper - `CallWindowsCard.vue` (Refactored)**

**Purpose:** Day View specific wrapper

**Responsibilities:**
- Manage recurring window conversion
- Handle Reset vs Clear logic
- Check journal entry status
- Show completed overlay
- Integrate with CallWindowManager
- Handle date changes

**Structure:**
```vue
<template>
  <div class="call-windows-card" :class="{ completed: hasJournalEntry }">
    <!-- Completed Overlay -->
    <div v-if="hasJournalEntry" class="completed-overlay">
      <!-- ... -->
    </div>
    
    <!-- Header -->
    <div class="card-header">
      <h3>Call Windows</h3>
      <div class="card-actions">
        <button @click="handleAdd">Add</button>
        <button @click="handleUndo" :disabled="!canUndo">Undo</button>
        <button @click="handleRedo" :disabled="!canRedo">Redo</button>
        <button @click="handleReset" title="Reset to recurring windows">
          Reset
        </button>
        <button @click="handleClear" title="Clear all windows">
          Clear
        </button>
      </div>
    </div>
    
    <!-- Reusable Manager Component -->
    <CallWindowManager
      :windows="displayWindows"
      :readonly="hasJournalEntry"
      show-empty-state
      :empty-state-hint="emptyStateHint"
      @window-create="handleCreate"
      @window-delete="handleDelete"
      @window-click="handleEdit"
      @merge-needed="handleMergePrompt"
    />
    
    <!-- Modals -->
    <CallWindowEditModal v-if="editingWindow" ... />
    <CallWindowMergePrompt v-if="showMergePrompt" ... />
  </div>
</template>
```

---

## 🎨 UX Improvements

### **1. Reset vs Clear Distinction**

**Current State:**
- Both buttons look similar
- Tooltips explain difference
- Not immediately obvious to users

**Proposed Improvements:**

**A. Visual Distinction**
```vue
<!-- Reset: Refresh icon, secondary style -->
<button class="action-btn reset-btn" title="Reset to recurring windows">
  <v-icon>mdi-refresh</v-icon>
  <span class="btn-label">Reset</span>
</button>

<!-- Clear: Delete icon, danger style -->
<button class="action-btn clear-btn danger" title="Clear all windows">
  <v-icon>mdi-delete-sweep</v-icon>
  <span class="btn-label">Clear</span>
</button>
```

**B. Confirmation Dialogs**
```typescript
const handleReset = async () => {
  const confirmed = confirm(
    'Reset to recurring windows?\n\n' +
    'This will remove all custom windows for this day and restore your weekly schedule.'
  );
  if (!confirmed) return;
  
  // ... reset logic
};

const handleClear = async () => {
  const confirmed = confirm(
    'Clear all windows?\n\n' +
    'This will remove ALL windows for this day, including recurring ones. ' +
    'You can undo this action.'
  );
  if (!confirmed) return;
  
  // ... clear logic
};
```

**C. Button Labels**
- Show text labels on larger screens
- Icon-only on mobile
- Clearer action names

---

### **2. Merge Confirmation Prompt**

**Current State:**
- Merge prompt shows but doesn't explain what will happen
- No preview of merged window

**Proposed Improvements:**

**CallWindowMergePrompt.vue:**
```vue
<template>
  <div class="merge-prompt-overlay">
    <div class="merge-prompt">
      <h3>Overlapping Windows Detected</h3>
      
      <p class="merge-explanation">
        The new window overlaps with {{ overlappingCount }} existing window(s).
        Would you like to merge them?
      </p>
      
      <div class="merge-preview">
        <div class="existing-windows">
          <h4>Existing:</h4>
          <div v-for="window in overlapping" :key="window.id" class="window-item">
            {{ formatTimeRange(window) }}
          </div>
        </div>
        
        <v-icon class="merge-arrow">mdi-arrow-right</v-icon>
        
        <div class="merged-window">
          <h4>Merged:</h4>
          <div class="window-item merged">
            {{ formatTimeRange(mergedWindow) }}
          </div>
        </div>
      </div>
      
      <div class="merge-actions">
        <button @click="$emit('cancel')" class="btn-secondary">
          Cancel
        </button>
        <button @click="$emit('merge')" class="btn-primary">
          Merge Windows
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  newWindow: { start: Date; end: Date };
  overlapping: Window[];
}

const props = defineProps<Props>();

const overlappingCount = computed(() => props.overlapping.length);

const mergedWindow = computed(() => {
  const allWindows = [...props.overlapping, props.newWindow];
  const minStart = new Date(Math.min(...allWindows.map(w => w.start.getTime())));
  const maxEnd = new Date(Math.max(...allWindows.map(w => w.end.getTime())));
  return { start: minStart, end: maxEnd };
});

const formatTimeRange = (window: { start: Date; end: Date }) => {
  // ... format logic
};
</script>
```

---

## 🧪 Testing Strategy

### **Phase 1: Write Tests for Current Implementation**

**Test File:** `CallWindowsCard.test.ts` (update existing)

**Test Categories:**

1. **Rendering**
   - ✅ Renders timeline grid
   - ✅ Shows time labels (12 AM - 11 PM)
   - ✅ Shows hour and quarter lines
   - ✅ Shows empty state when no windows
   
2. **Window Display**
   - ✅ Displays recurring windows as defaults
   - ✅ Displays one-off windows when they exist
   - ✅ Calculates correct position and height
   - ✅ Formats time correctly (12-hour AM/PM)
   - ✅ Shows delete button on hover
   
3. **Drag-to-Create**
   - ✅ Creates preview on drag
   - ✅ Snaps to 5-minute intervals
   - ✅ Enforces minimum 5-minute duration
   - ✅ Creates window on valid drag
   - ✅ Cancels on invalid drag (too short)
   - ✅ Cancels on mouse leave
   
4. **Window Operations**
   - ✅ Creates window via add button
   - ✅ Deletes window via delete button
   - ✅ Edits window via click
   - ✅ Saves edited window
   - ✅ Cancels edit
   
5. **Overlap Detection**
   - ✅ Detects overlapping windows
   - ✅ Shows merge prompt on overlap
   - ✅ Merges windows on confirm
   - ✅ Cancels merge on cancel
   
6. **Undo/Redo**
   - ✅ Undoes create
   - ✅ Undoes delete
   - ✅ Redoes create
   - ✅ Redoes delete
   - ✅ Clears redo stack on new action
   - ✅ Limits undo stack to 10
   - ✅ Disables buttons when stacks empty
   
7. **Reset vs Clear**
   - ✅ Reset removes one-off, shows recurring
   - ✅ Clear removes all, keeps day initialized
   - ✅ Reset can be undone
   - ✅ Clear can be undone
   
8. **Recurring Window Conversion**
   - ✅ Shows recurring as defaults initially
   - ✅ Converts to one-off on first interaction
   - ✅ Doesn't convert if already initialized
   - ✅ Doesn't convert if undo stack has items
   
9. **Journal Entry Check**
   - ✅ Shows overlay when entry exists
   - ✅ Disables interactions when completed
   - ✅ Updates on date change
   
10. **Date Navigation**
    - ✅ Loads windows for new date
    - ✅ Updates display on date change
    - ✅ Preserves undo stack per date

---

### **Phase 2: Refactor with Tests**

**Process:**
1. Run all tests → Establish baseline (all pass)
2. Extract composable → Run tests (should still pass)
3. Create component → Run tests (should still pass)
4. Refactor wrapper → Run tests (should still pass)
5. Add UX improvements → Update tests as needed
6. Final test run → All pass

**New Test Files:**

1. **`useCallWindowManager.test.ts`**
   - Test composable logic in isolation
   - Mock API calls
   - Test state management
   - Test utility functions

2. **`CallWindowManager.test.ts`**
   - Test component rendering
   - Test event emissions
   - Test prop handling
   - Test drag interactions

3. **`CallWindowsCard.test.ts`** (updated)
   - Test Day View specific logic
   - Test recurring conversion
   - Test Reset vs Clear
   - Test journal entry integration

---

## 📝 Implementation Steps

### **Step 1: Document & Test Current Behavior** ✅

- [x] Analyze CallWindowsCard functionality
- [x] Create comprehensive test specification
- [ ] Write tests for all current features
- [ ] Run tests to establish baseline

### **Step 2: Extract Composable**

- [ ] Create `useCallWindowManager.ts`
- [ ] Move pure logic functions
- [ ] Move state management
- [ ] Move API calls
- [ ] Export clean interface
- [ ] Run tests (should pass)

### **Step 3: Create Reusable Component**

- [ ] Create `CallWindowManager.vue`
- [ ] Move timeline rendering
- [ ] Move drag handlers
- [ ] Move window display
- [ ] Add prop-based configuration
- [ ] Emit events for parent handling
- [ ] Run tests (should pass)

### **Step 4: Refactor Wrapper**

- [ ] Update `CallWindowsCard.vue`
- [ ] Use `CallWindowManager` component
- [ ] Keep Day View specific logic
- [ ] Maintain same external API
- [ ] Run tests (should pass)

### **Step 5: Add UX Improvements**

- [ ] Add Reset/Clear confirmation dialogs
- [ ] Add visual distinction for buttons
- [ ] Improve merge prompt with preview
- [ ] Add button labels
- [ ] Update tests for new behavior
- [ ] Run tests (all pass)

### **Step 6: Documentation**

- [ ] Update component documentation
- [ ] Create usage examples
- [ ] Document props and events
- [ ] Update DESIGN_DECISIONS.md
- [ ] Create migration guide

---

## 🎯 Success Criteria

1. ✅ **All existing tests pass** after refactoring
2. ✅ **No regressions** in Day View functionality
3. ✅ **Reusable components** can be used elsewhere
4. ✅ **Improved UX** for Reset vs Clear
5. ✅ **Better merge prompt** with preview
6. ✅ **Clean separation** of concerns
7. ✅ **Comprehensive documentation**

---

## 🚀 Benefits

### **For Developers:**
- Reusable window management logic
- Easier to test and maintain
- Clear separation of concerns
- Well-documented API

### **For Users:**
- Clearer distinction between Reset and Clear
- Better understanding of merge operations
- More intuitive interactions
- Consistent behavior across views

### **For Future Features:**
- Easy to add new window views
- Can reuse logic in Schedule page
- Can create custom window managers
- Extensible architecture

---

## 📊 Risk Assessment

### **Low Risk:**
- Extracting pure functions (no side effects)
- Moving state to composable (same behavior)
- Creating new component (additive)

### **Medium Risk:**
- Refactoring CallWindowsCard (many dependencies)
- Changing UX (user expectations)
- Updating tests (may need adjustments)

### **Mitigation:**
- Write comprehensive tests first
- Refactor incrementally
- Run tests after each step
- Keep old implementation as backup
- Test manually in browser

---

## 🔄 Rollback Plan

If issues arise during refactoring:

1. **Revert to last working commit**
2. **Identify specific issue**
3. **Fix in isolation**
4. **Re-run tests**
5. **Continue refactoring**

**Git Strategy:**
```bash
# Create feature branch
git checkout -b refactor/call-window-manager

# Commit after each major step
git commit -m "Step 1: Add comprehensive tests"
git commit -m "Step 2: Extract composable"
git commit -m "Step 3: Create reusable component"
# etc.

# If issues, revert specific commits
git revert <commit-hash>
```

---

## 📅 Timeline Estimate

- **Step 1 (Testing):** 2-3 hours
- **Step 2 (Composable):** 2-3 hours
- **Step 3 (Component):** 2-3 hours
- **Step 4 (Refactor):** 2-3 hours
- **Step 5 (UX):** 1-2 hours
- **Step 6 (Docs):** 1 hour

**Total:** 10-15 hours

**Phased Approach:**
- Can stop after any step if needed
- Each step adds value independently
- Tests ensure no regressions

---

## ✅ Next Actions

1. Review this plan with team
2. Get approval for approach
3. Begin Step 1: Write comprehensive tests
4. Execute refactoring plan step by step
5. Document learnings and improvements

---

**Status:** 📋 **PLAN READY - AWAITING APPROVAL**
