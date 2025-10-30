# CallWindowsCard Refactor Preview

## New Structure

### Template (Simplified)
```vue
<template>
  <div class="call-windows-card" :class="{ 'completed': hasJournalEntry }">
    <!-- Completed Overlay (unchanged) -->
    <div v-if="hasJournalEntry" class="completed-overlay">
      <!-- ... -->
    </div>

    <!-- Header with Enhanced Actions -->
    <div class="card-header">
      <h3 class="card-title">Call Windows</h3>
      <div class="card-actions">
        <!-- Add Button -->
        <button class="action-btn add-btn" @click="handleAddWindow">
          <v-icon size="16">mdi-plus</v-icon>
        </button>
        
        <div class="button-divider"></div>
        
        <!-- Undo/Redo -->
        <button class="action-btn" @click="handleUndo" :disabled="!canUndo">
          <v-icon size="16">mdi-undo-variant</v-icon>
        </button>
        <button class="action-btn" @click="handleRedo" :disabled="!canRedo">
          <v-icon size="16">mdi-redo-variant</v-icon>
        </button>
        
        <div class="button-divider"></div>
        
        <!-- Reset (with better UX) -->
        <button class="action-btn reset-btn" @click="handleReset">
          <v-icon size="16">mdi-refresh</v-icon>
          <span class="btn-label">Reset</span>
        </button>
        
        <!-- Clear (with danger styling) -->
        <button class="action-btn clear-btn danger" @click="handleClear">
          <v-icon size="16">mdi-delete-sweep</v-icon>
          <span class="btn-label">Clear</span>
        </button>
      </div>
    </div>

    <!-- Reusable Timeline Component -->
    <CallWindowManager
      :windows="displayWindows"
      :base-date="selectedDate"
      :readonly="hasJournalEntry"
      show-empty-state
      :empty-state-hint="emptyStateHint"
      @window-create="handleWindowCreate"
      @window-delete="handleWindowDelete"
      @window-click="handleWindowClick"
      @merge-needed="handleMergeNeeded"
    >
      <!-- Custom empty state for today -->
      <template #empty-state-extra v-if="isToday">
        <p class="empty-hint-secondary">
          Or <a href="#" @click.prevent="handleInitiateCall">initiate a call manually</a>
        </p>
      </template>
    </CallWindowManager>

    <!-- Modals -->
    <CallWindowEditModal
      v-if="editingWindow"
      :window="editingWindow"
      @save="handleSaveEdit"
      @cancel="handleCancelEdit"
      @delete="handleDeleteFromModal"
    />

    <CallWindowMergePrompt
      v-if="showMergePrompt"
      :new-window="pendingWindow"
      :overlapping="overlappingWindows"
      @merge="handleMergeConfirm"
      @cancel="handleMergeCancel"
    />
  </div>
</template>
```

### Script (Key Changes)
```typescript
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '@/services/api';
import CallWindowManager from './CallWindowManager.vue';
import CallWindowEditModal from './CallWindowEditModal.vue';
import CallWindowMergePrompt from './CallWindowMergePrompt.vue';

// Props (unchanged)
interface Props {
  selectedDate: Date;
  userId: string;
}

const props = defineProps<Props>();

// State - Day View Specific
const displayWindows = ref<DisplayWindow[]>([]);
const recurringWindows = ref<RecurringWindow[]>([]);
const oneOffWindows = ref<OneOffWindow[]>([]);
const dayInitialized = ref(false);
const hasJournalEntry = ref(false);
const editingWindow = ref<DisplayWindow | null>(null);

// State - Merge Prompt
const showMergePrompt = ref(false);
const pendingWindow = ref<{ startTime: Date; endTime: Date } | null>(null);
const overlappingWindows = ref<DisplayWindow[]>([]);

// State - Undo/Redo
const undoStack = ref<UndoState[]>([]);
const redoStack = ref<UndoState[]>([]);

// Computed
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);
const isToday = computed(() => /* check if selected date is today */);
const emptyStateHint = computed(() => 
  isToday.value 
    ? 'Click and drag to create a window' 
    : 'No windows scheduled for this day'
);

// Day View Specific Logic

/**
 * RESET: Remove one-off windows, show recurring defaults again
 */
const handleReset = async () => {
  const confirmed = confirm(
    'Reset to Weekly Schedule?\n\n' +
    'This will remove all custom windows for this day and restore your recurring weekly schedule.\n\n' +
    'You can undo this action.'
  );
  
  if (!confirmed) return;
  
  pushUndo('reset');
  
  // Delete all one-off windows for this date
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
  
  // Clear local state
  oneOffWindows.value = oneOffWindows.value.filter(
    w => w.specificDate !== selectedDateString.value
  );
  
  // Mark as uninitialized so recurring windows show again
  dayInitialized.value = false;
  
  updateDisplayWindows();
};

/**
 * CLEAR: Remove ALL windows (including recurring), keep day initialized
 */
const handleClear = async () => {
  const confirmed = confirm(
    'Clear All Windows?\n\n' +
    'This will remove ALL windows for this day, including your recurring schedule.\n\n' +
    'The day will remain customized (recurring windows won\'t reappear).\n\n' +
    'You can undo this action.'
  );
  
  if (!confirmed) return;
  
  pushUndo('clear');
  
  // Delete all one-off windows for this date
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
  
  // Clear local state
  oneOffWindows.value = oneOffWindows.value.filter(
    w => w.specificDate !== selectedDateString.value
  );
  
  // Keep initialized flag true - day has been edited
  dayInitialized.value = true;
  
  updateDisplayWindows();
};

/**
 * Handle merge prompt - show preview
 */
const handleMergeNeeded = ({ newWindow, overlapping }) => {
  pendingWindow.value = newWindow;
  overlappingWindows.value = overlapping;
  showMergePrompt.value = true;
};

/**
 * Convert recurring windows to one-off on first interaction
 */
const ensureOneOffWindowsExist = async () => {
  // Check if we already have one-off windows for this date
  const existingOneOff = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  
  if (existingOneOff.length > 0) {
    return; // Already have one-off windows
  }
  
  // Get recurring windows for this day and convert them to one-off
  const dayRecurring = recurringWindows.value.filter(
    w => w.dayOfWeek === selectedDayOfWeek.value
  );
  
  for (const recurring of dayRecurring) {
    const startTime = new Date(recurring.startTime);
    const endTime = new Date(recurring.endTime);
    
    // Set the date to the selected date
    const dateStart = new Date(props.selectedDate);
    dateStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    
    const dateEnd = new Date(props.selectedDate);
    dateEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    
    await api.createOneOffCallWindow(
      props.userId,
      selectedDateString.value,
      dateStart,
      dateEnd
    );
  }
  
  await loadOneOffWindows();
};

// ... rest of the logic
</script>
```

### Style (Enhanced)
```css
/* Reset button - secondary style */
.reset-btn {
  color: #666;
}

.reset-btn:hover {
  background: rgba(32, 128, 141, 0.1);
  color: #20808d;
}

/* Clear button - danger style */
.clear-btn.danger {
  color: #d32f2f;
}

.clear-btn.danger:hover {
  background: rgba(211, 47, 47, 0.1);
  color: #b71c1c;
}

/* Button labels (show on larger screens) */
.btn-label {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .btn-label {
    display: none;
  }
}
```

## Key Changes

### 1. Simplified Template
- **Before**: 1045 lines with all timeline rendering inline
- **After**: ~200 lines, timeline delegated to CallWindowManager

### 2. Clear Responsibilities
- **CallWindowsCard**: Day View logic (recurring conversion, reset/clear, journal check)
- **CallWindowManager**: Timeline rendering and interactions
- **Composable**: Pure logic functions

### 3. Better UX
- **Reset**: Clear confirmation explaining it restores weekly schedule
- **Clear**: Warning confirmation explaining it removes everything
- **Visual distinction**: Different colors and icons
- **Button labels**: Text labels on desktop for clarity

### 4. Event-Based Communication
- **Before**: Direct manipulation of DOM and state
- **After**: Clean events from CallWindowManager to parent

### 5. Maintainability
- **Easier to test**: Clear boundaries
- **Easier to modify**: Change timeline without touching Day View logic
- **Reusable**: CallWindowManager can be used elsewhere (Schedule page!)

## Benefits

### For Users
- ✅ Clearer understanding of Reset vs Clear
- ✅ Better merge preview
- ✅ More intuitive interactions

### For Developers
- ✅ Reusable components
- ✅ Easier to test
- ✅ Clear separation of concerns
- ✅ Less code duplication

### For Future
- ✅ Can use CallWindowManager in Schedule page
- ✅ Can create other window views easily
- ✅ Extensible architecture

## Next Steps

1. Implement this refactor
2. Test manually in browser
3. Fix unit tests
4. Document new architecture
5. Create usage examples

---

**Ready to implement?** This refactor will make the code much cleaner while preserving all functionality and improving UX!
