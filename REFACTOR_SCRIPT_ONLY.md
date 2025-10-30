# Refactored CallWindowsCard - Script Section Only

This document shows the new `<script setup>` section for CallWindowsCard.vue after refactoring to use the composable.

**Template and Styles remain EXACTLY the same!**

## New Script Section:

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted, toRef } from 'vue';
import { api } from '@/services/api';
import CallWindowEditModal from './CallWindowEditModal.vue';
import CallWindowMergePrompt from './CallWindowMergePrompt.vue';
import { useDayCallWindows, type DisplayWindow } from '@/composables/useDayCallWindows';

// Props
const props = defineProps<{
  selectedDate: Date;
  userId: string;
}>();

// Constants
const HOUR_HEIGHT = 60;
const QUARTER_HEIGHT = 15;
const MIN_WINDOW_DURATION = 5;

// Use the composable for all window management logic
const {
  displayWindows,
  canUndo,
  canRedo,
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
  ensureOneOffWindowsExist,
} = useDayCallWindows(toRef(props, 'userId'), toRef(props, 'selectedDate'));

// Day View specific: Journal entry checking
const hasJournalEntry = ref(false);

const checkJournalEntry = async () => {
  try {
    const selectedDateString = computed(() => {
      const year = props.selectedDate.getFullYear();
      const month = String(props.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(props.selectedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    
    const result = await api.getEntryByDate(props.userId, selectedDateString.value);
    hasJournalEntry.value = !!result && !('error' in result);
  } catch (error) {
    hasJournalEntry.value = false;
  }
};

// UI State
const editingWindow = ref<DisplayWindow | null>(null);
const showMergePrompt = ref(false);
const pendingWindow = ref<{ startTime: Date; endTime: Date } | null>(null);
const overlappingWindows = ref<DisplayWindow[]>([]);
const hoveredWindow = ref<string | null>(null);

// Drag state
const isDragging = ref(false);
const dragStart = ref<number | null>(null);
const dragPreview = ref<{ startTime: Date; endTime: Date } | null>(null);
const timelineContainer = ref<HTMLElement | null>(null);

// Time formatting
const formatHour = (hour: number): string => {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Window positioning
const getWindowStyle = (window: DisplayWindow) => {
  const startHour = window.startTime.getHours() + window.startTime.getMinutes() / 60;
  const endHour = window.endTime.getHours() + window.endTime.getMinutes() / 60;
  const top = startHour * HOUR_HEIGHT;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  
  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

// Drag handlers
const timeFromY = (y: number): Date => {
  if (!timelineContainer.value) return new Date();
  
  const rect = timelineContainer.value.getBoundingClientRect();
  const scrollTop = timelineContainer.value.scrollTop;
  const relativeY = y - rect.top + scrollTop;
  const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  
  const date = new Date(props.selectedDate);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(roundedMinutes);
  
  return date;
};

const handleMouseDown = (e: MouseEvent) => {
  if (e.target !== e.currentTarget) return;
  
  isDragging.value = true;
  dragStart.value = e.clientY;
  
  const startTime = timeFromY(e.clientY);
  dragPreview.value = { startTime, endTime: startTime };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !dragStart.value || !dragPreview.value) return;
  
  const currentTime = timeFromY(e.clientY);
  const startTime = timeFromY(dragStart.value);
  
  if (currentTime > startTime) {
    dragPreview.value = { startTime, endTime: currentTime };
  } else {
    dragPreview.value = { startTime: currentTime, endTime: startTime };
  }
};

const handleMouseUp = async (e: MouseEvent) => {
  if (!isDragging.value || !dragPreview.value) return;
  
  const window = dragPreview.value;
  const duration = (window.endTime.getTime() - window.startTime.getTime()) / (1000 * 60);
  
  if (duration >= MIN_WINDOW_DURATION) {
    const overlapping = findOverlappingWindows({ startTime: window.startTime, endTime: window.endTime });
    
    if (overlapping.length > 0) {
      const hasRecurringOverlap = overlapping.some(w => w.type === undefined || w.isRecurringDefault);
      if (hasRecurringOverlap) {
        await ensureOneOffWindowsExist();
        await updateDisplayWindows();
      }
      
      pendingWindow.value = { startTime: window.startTime, endTime: window.endTime };
      overlappingWindows.value = overlapping;
      showMergePrompt.value = true;
    } else {
      await createWindow(window.startTime, window.endTime);
    }
  }
  
  isDragging.value = false;
  dragStart.value = null;
  dragPreview.value = null;
};

const handleMouseLeave = () => {
  if (isDragging.value) {
    isDragging.value = false;
    dragStart.value = null;
    dragPreview.value = null;
  }
};

// Window actions
const handleWindowClick = (window: DisplayWindow) => {
  editingWindow.value = window;
};

const handleAddWindow = () => {
  const startTime = new Date(props.selectedDate);
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date(props.selectedDate);
  endTime.setHours(10, 0, 0, 0);
  
  editingWindow.value = {
    id: 'new',
    startTime,
    endTime,
    type: 'ONEOFF',
  };
};

const handleDeleteWindow = async (window: DisplayWindow) => {
  hoveredWindow.value = null;
  await deleteWindow(window);
};

const handleSaveEdit = async (updatedWindow: DisplayWindow) => {
  await deleteWindow(editingWindow.value!);
  await createWindow(updatedWindow.startTime, updatedWindow.endTime);
  editingWindow.value = null;
};

const handleCancelEdit = () => {
  editingWindow.value = null;
};

const handleDeleteFromModal = async () => {
  if (editingWindow.value) {
    await deleteWindow(editingWindow.value);
    editingWindow.value = null;
  }
};

const handleUndo = async () => {
  await undo();
};

const handleRedo = async () => {
  await redo();
};

const handleMergeConfirm = async () => {
  if (!pendingWindow.value) return;
  
  await createWindow(pendingWindow.value.startTime, pendingWindow.value.endTime, true);
  showMergePrompt.value = false;
  pendingWindow.value = null;
  overlappingWindows.value = [];
};

const handleMergeCancel = () => {
  showMergePrompt.value = false;
  pendingWindow.value = null;
  overlappingWindows.value = [];
};

const handleInitiateCall = () => {
  console.log('Initiating call...');
};

// Lifecycle
onMounted(async () => {
  await loadWindows();
  await checkJournalEntry();
});

watch(() => props.selectedDate, async () => {
  await loadWindows();
  await checkJournalEntry();
});
</script>
```

## Key Changes:

1. ✅ **Imported composable** - `useDayCallWindows`
2. ✅ **Removed all window management logic** - Now in composable
3. ✅ **Kept all UI logic** - Drag, modals, journal entry
4. ✅ **Kept all formatting** - `formatHour`, `formatTime`, `getWindowStyle`
5. ✅ **Kept all event handlers** - Mouse events, button clicks
6. ✅ **Template unchanged** - Exact same HTML
7. ✅ **Styles unchanged** - Exact same CSS

## Lines of Code:

- **Before:** ~800 lines in script
- **After:** ~250 lines in script
- **Reduction:** ~550 lines moved to composable!

## What Stayed in Component:

- ✅ Journal entry checking (Day View specific)
- ✅ Drag-to-create UI logic
- ✅ Modal management
- ✅ Time formatting for display
- ✅ Window positioning calculations
- ✅ All event handlers

## What Moved to Composable:

- ✅ Window state management
- ✅ Day mode logic
- ✅ CRUD operations
- ✅ Undo/Redo
- ✅ Clear/Reset
- ✅ Overlap detection
- ✅ API calls
