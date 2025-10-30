<template>
  <div class="call-windows-card">
    <!-- Header with controls -->
    <div class="card-header">
      <h3 class="card-title">Call Windows</h3>
      <div class="card-actions">
        <button 
          class="action-btn add-btn" 
          @click="handleAddWindow" 
          title="Add window"
        >
          <v-icon size="16">mdi-plus</v-icon>
        </button>
        <div class="button-divider"></div>
        <button 
          class="action-btn" 
          @click="handleUndo" 
          :disabled="!canUndo"
          title="Undo"
        >
          <v-icon size="16">mdi-undo-variant</v-icon>
        </button>
        <button 
          class="action-btn" 
          @click="handleRedo" 
          :disabled="!canRedo"
          title="Redo"
        >
          <v-icon size="16">mdi-redo-variant</v-icon>
        </button>
        <div class="button-divider"></div>
        <button 
          class="action-btn" 
          @click="handleReset" 
          title="Reset"
        >
          <v-icon size="16">mdi-refresh</v-icon>
        </button>
        <button 
          class="action-btn" 
          @click="handleClear" 
          title="Clear"
        >
          <v-icon size="16">mdi-delete-outline</v-icon>
        </button>
      </div>
    </div>

    <!-- Timeline grid -->
    <div class="timeline-container" ref="timelineContainer">
      <div class="timeline-grid">
        <!-- Time labels -->
        <div class="time-labels">
          <div 
            v-for="hour in 24" 
            :key="hour" 
            class="time-label"
            :style="{ height: `${HOUR_HEIGHT}px` }"
          >
            {{ formatHour(hour - 1) }}
          </div>
        </div>

        <!-- Grid lines and interaction area -->
        <div 
          class="grid-area"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        >
          <!-- Hour lines -->
          <div 
            v-for="hour in 24" 
            :key="`line-${hour}`" 
            class="hour-line"
            :style="{ top: `${(hour - 1) * HOUR_HEIGHT}px` }"
          />

          <!-- Quarter-hour lines -->
          <div 
            v-for="quarter in 96" 
            :key="`quarter-${quarter}`" 
            class="quarter-line"
            :style="{ top: `${(quarter - 1) * QUARTER_HEIGHT}px` }"
          />

          <!-- Existing call windows -->
          <div
            v-for="window in displayWindows"
            :key="window.id"
            class="call-window"
            :class="{ 'recurring-default': window.isRecurringDefault, 'hovered': hoveredWindow?.id === window.id }"
            :style="getWindowStyle(window)"
            @mouseenter="hoveredWindow = window"
            @mouseleave="hoveredWindow = null"
            @click="handleWindowClick(window)"
          >
            <div class="window-content">
              <span class="window-time">
                {{ formatTime(window.startTime) }} - {{ formatTime(window.endTime) }}
              </span>
              <button 
                v-if="hoveredWindow?.id === window.id"
                class="window-delete-btn"
                @click.stop="handleDeleteWindow(window)"
                title="Delete window"
              >
                <v-icon size="14">mdi-delete</v-icon>
              </button>
            </div>
          </div>

          <!-- Drag preview -->
          <div
            v-if="isDragging && dragPreview"
            class="call-window drag-preview"
            :style="getWindowStyle(dragPreview)"
          >
            <div class="window-content">
              <span class="window-time">
                {{ formatTime(dragPreview.startTime) }} - {{ formatTime(dragPreview.endTime) }}
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- Empty state -->
      <div v-if="displayWindows.length === 0 && !isDragging" class="empty-state">
        <v-icon size="48" class="empty-icon">mdi-calendar-clock-outline</v-icon>
        <p class="empty-text">No call windows scheduled</p>
        <p class="empty-hint">Click and drag to create a window</p>
        <p v-if="isToday" class="empty-hint-secondary">
          Or <a href="#" @click.prevent="handleInitiateCall">initiate a call manually</a>
        </p>
      </div>
    </div>

    <!-- Edit modal -->
    <CallWindowEditModal
      v-if="editingWindow"
      :window="editingWindow"
      @save="handleSaveEdit"
      @cancel="handleCancelEdit"
      @delete="handleDeleteFromModal"
    />

    <!-- Merge prompt -->
    <CallWindowMergePrompt
      v-if="showMergePrompt"
      @merge="handleMergeConfirm"
      @cancel="handleMergeCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '@/services/api';
import type { DisplayWindow, RecurringWindow, OneOffWindow, DayOfWeek } from '@/types/callWindow';
import CallWindowEditModal from './CallWindowEditModal.vue';
import CallWindowMergePrompt from './CallWindowMergePrompt.vue';

interface Props {
  selectedDate: Date;
  userId: string;
}

const props = defineProps<Props>();

// Constants
const HOUR_HEIGHT = 60; // pixels per hour
const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15 pixels per 15 minutes
const MIN_WINDOW_DURATION = 5; // minimum 5 minutes

// State
const displayWindows = ref<DisplayWindow[]>([]);
const recurringWindows = ref<RecurringWindow[]>([]);
const oneOffWindows = ref<OneOffWindow[]>([]);
const isDragging = ref(false);
const dragStart = ref<{ y: number; time: Date } | null>(null);
const dragPreview = ref<DisplayWindow | null>(null);
const hoveredWindow = ref<DisplayWindow | null>(null);
const timelineContainer = ref<HTMLElement | null>(null);
const showAddModal = ref(false);
const showMergePrompt = ref(false);
const pendingWindow = ref<{ startTime: Date; endTime: Date } | null>(null);
const editingWindow = ref<DisplayWindow | null>(null);
const undoStack = ref<{ windows: OneOffWindow[]; action: string }[]>([]);
const redoStack = ref<{ windows: OneOffWindow[]; action: string }[]>([]);
const dayInitialized = ref(false); // Track if this day has been initialized from recurring

// Computed
const isToday = computed(() => {
  const today = new Date();
  return (
    props.selectedDate.getDate() === today.getDate() &&
    props.selectedDate.getMonth() === today.getMonth() &&
    props.selectedDate.getFullYear() === today.getFullYear()
  );
});

const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

const selectedDateString = computed(() => {
  return props.selectedDate.toISOString().split('T')[0];
});

const selectedDayOfWeek = computed((): DayOfWeek => {
  const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[props.selectedDate.getDay()];
});

// Methods
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

const getWindowStyle = (window: DisplayWindow) => {
  const startMinutes = window.startTime.getHours() * 60 + window.startTime.getMinutes();
  const endMinutes = window.endTime.getHours() * 60 + window.endTime.getMinutes();
  const duration = endMinutes - startMinutes;
  
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;
  
  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

const timeFromY = (y: number): Date => {
  if (!timelineContainer.value) return new Date();
  
  const rect = timelineContainer.value.getBoundingClientRect();
  const scrollTop = timelineContainer.value.scrollTop;
  const relativeY = y - rect.top + scrollTop;
  const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;
  
  // Snap to 5-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 5) * 5;
  const clampedMinutes = Math.max(0, Math.min(1440, snappedMinutes)); // 0-1440 (24 hours)
  
  const date = new Date(props.selectedDate);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(clampedMinutes);
  
  return date;
};

const handleMouseDown = (e: MouseEvent) => {
  // Only allow drag to start from empty space (not on existing windows)
  // But allow drag to end/release over existing windows (checked in handleMouseUp)
  if (e.target !== e.currentTarget) return;
  
  isDragging.value = true;
  const startTime = timeFromY(e.clientY);
  dragStart.value = { y: e.clientY, time: startTime };
  
  dragPreview.value = {
    id: 'preview',
    startTime,
    endTime: new Date(startTime.getTime() + 15 * 60 * 1000), // 15 minutes
    type: 'ONEOFF',
  };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !dragStart.value || !dragPreview.value) return;
  
  const currentTime = timeFromY(e.clientY);
  const startTime = dragStart.value.time;
  
  if (currentTime > startTime) {
    dragPreview.value.startTime = startTime;
    dragPreview.value.endTime = currentTime;
  } else {
    dragPreview.value.startTime = currentTime;
    dragPreview.value.endTime = startTime;
  }
};

const handleMouseUp = async (e: MouseEvent) => {
  if (!isDragging.value || !dragPreview.value) return;
  
  const window = dragPreview.value;
  const duration = (window.endTime.getTime() - window.startTime.getTime()) / (1000 * 60);
  
  if (duration >= MIN_WINDOW_DURATION) {
    // Check for overlaps and prompt user if found
    const overlapping = findOverlappingWindows({ startTime: window.startTime, endTime: window.endTime });
    
    if (overlapping.length > 0) {
      // Show merge prompt
      pendingWindow.value = { startTime: window.startTime, endTime: window.endTime };
      showMergePrompt.value = true;
    } else {
      // No overlap, create directly
      await createOneOffWindow(window.startTime, window.endTime);
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

const handleWindowClick = (window: DisplayWindow) => {
  editingWindow.value = window;
};

const handleAddWindow = () => {
  // Create a default window from 9 AM to 10 AM
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
  // Delete old window and create new one with updated times
  await deleteWindow(editingWindow.value!);
  await createOneOffWindow(updatedWindow.startTime, updatedWindow.endTime);
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
  if (undoStack.value.length === 0) return;
  
  // Save current state to redo stack
  redoStack.value.push({
    windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
    action: 'undo',
  });
  
  const lastState = undoStack.value.pop()!;
  oneOffWindows.value = lastState.windows;
  await syncOneOffWindows();
  updateDisplayWindows();
};

const handleRedo = async () => {
  if (redoStack.value.length === 0) return;
  
  // Save current state to undo stack
  undoStack.value.push({
    windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
    action: 'redo',
  });
  
  const lastState = redoStack.value.pop()!;
  oneOffWindows.value = lastState.windows;
  await syncOneOffWindows();
  updateDisplayWindows();
};

const handleReset = async () => {
  // Save current state for undo
  pushUndo('reset');
  
  // Delete all windows for this date from backend
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

const handleClear = async () => {
  // Save current state for undo
  pushUndo('clear');
  
  // Delete all windows for this date from backend
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
  
  // Keep initialized flag true - day has been edited, just cleared
  // This prevents recurring windows from being converted again
  dayInitialized.value = true;
  
  updateDisplayWindows();
};

const handleInitiateCall = () => {
  // TODO: Implement call initiation
  console.log('Initiating call...');
};

const handleMergeConfirm = async () => {
  if (!pendingWindow.value) return;
  
  await createOneOffWindow(pendingWindow.value.startTime, pendingWindow.value.endTime, true);
  showMergePrompt.value = false;
  pendingWindow.value = null;
};

const handleMergeCancel = () => {
  showMergePrompt.value = false;
  pendingWindow.value = null;
};

const pushUndo = (action: string) => {
  undoStack.value.push({
    windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
    action,
  });
  
  // Clear redo stack on new action
  redoStack.value = [];
  
  // Limit undo stack to 10 items
  if (undoStack.value.length > 10) {
    undoStack.value.shift();
  }
};

const checkOverlap = (window1: { startTime: Date; endTime: Date }, window2: { startTime: Date; endTime: Date }): boolean => {
  return window1.startTime < window2.endTime && window1.endTime > window2.startTime;
};

const findOverlappingWindows = (newWindow: { startTime: Date; endTime: Date }): DisplayWindow[] => {
  return displayWindows.value.filter(w => checkOverlap(newWindow, w));
};

const createOneOffWindow = async (startTime: Date, endTime: Date, shouldMerge: boolean = false) => {
  // Only convert recurring windows on first interaction with this day
  // BUT: Don't do this if we already have local state changes (undo/redo/clear/delete)
  if (!dayInitialized.value && undoStack.value.length === 0) {
    await ensureOneOffWindowsExist();
    dayInitialized.value = true;
  }
  
  // Save current state for undo BEFORE making changes
  pushUndo('create');
  
  let result;
  if (shouldMerge) {
    // Merge overlapping windows using backend
    result = await api.mergeOverlappingOneOffWindows(
      props.userId,
      selectedDateString.value,
      startTime,
      endTime
    );
  } else {
    // No overlap, create normally
    result = await api.createOneOffCallWindow(
      props.userId,
      selectedDateString.value,
      startTime,
      endTime
    );
  }
  
  if ('error' in result) {
    console.error('Failed to create window:', result.error);
    undoStack.value.pop(); // Remove undo entry on failure
    return;
  }
  
  await loadOneOffWindows();
  updateDisplayWindows();
};

const deleteWindow = async (window: DisplayWindow) => {
  // Only convert recurring windows on first interaction with this day
  // BUT: Don't do this if we already have local state changes (undo/redo/clear/delete)
  if (!dayInitialized.value && undoStack.value.length === 0) {
    await ensureOneOffWindowsExist();
    dayInitialized.value = true;
  }
  
  // Save current state for undo BEFORE making changes
  pushUndo('delete');
  
  const result = await api.deleteOneOffCallWindow(
    props.userId,
    selectedDateString.value,
    window.startTime
  );
  
  if ('error' in result) {
    console.error('Failed to delete window:', result.error);
    undoStack.value.pop(); // Remove undo entry on failure
    return;
  }
  
  await loadOneOffWindows();
  updateDisplayWindows();
};

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

const syncOneOffWindows = async () => {
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
  
  // Recreate from current state
  const windowsToCreate = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  
  for (const window of windowsToCreate) {
    await api.createOneOffCallWindow(
      props.userId,
      selectedDateString.value,
      new Date(window.startTime),
      new Date(window.endTime)
    );
  }
};

const loadRecurringWindows = async () => {
  const result = await api.getUserRecurringWindows(props.userId);
  if (Array.isArray(result)) {
    recurringWindows.value = result;
  }
};

const loadOneOffWindows = async () => {
  const result = await api.getUserOneOffWindows(props.userId);
  if (Array.isArray(result)) {
    oneOffWindows.value = result;
  }
};

const updateDisplayWindows = () => {
  const windows: DisplayWindow[] = [];
  
  // Check if we have one-off windows for this date
  const dateOneOff = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  
  if (dateOneOff.length > 0) {
    // Show one-off windows
    for (const window of dateOneOff) {
      const startTime = new Date(window.startTime);
      const endTime = new Date(window.endTime);
      
      // Set the date component
      startTime.setFullYear(props.selectedDate.getFullYear());
      startTime.setMonth(props.selectedDate.getMonth());
      startTime.setDate(props.selectedDate.getDate());
      
      endTime.setFullYear(props.selectedDate.getFullYear());
      endTime.setMonth(props.selectedDate.getMonth());
      endTime.setDate(props.selectedDate.getDate());
      
      windows.push({
        id: window._id,
        startTime,
        endTime,
        type: 'ONEOFF',
      });
    }
  } else {
    // Show recurring windows as defaults
    const dayRecurring = recurringWindows.value.filter(
      w => w.dayOfWeek === selectedDayOfWeek.value
    );
    
    for (const window of dayRecurring) {
      const startTime = new Date(window.startTime);
      const endTime = new Date(window.endTime);
      
      // Set the date to the selected date
      startTime.setFullYear(props.selectedDate.getFullYear());
      startTime.setMonth(props.selectedDate.getMonth());
      startTime.setDate(props.selectedDate.getDate());
      
      endTime.setFullYear(props.selectedDate.getFullYear());
      endTime.setMonth(props.selectedDate.getMonth());
      endTime.setDate(props.selectedDate.getDate());
      
      windows.push({
        id: window._id,
        startTime,
        endTime,
        type: 'RECURRING',
        isRecurringDefault: true,
      });
    }
  }
  
  displayWindows.value = windows;
};

// Lifecycle
onMounted(async () => {
  await loadRecurringWindows();
  await loadOneOffWindows();
  
  // Check if this day has been initialized (has one-off windows)
  const existingOneOff = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  dayInitialized.value = existingOneOff.length > 0;
  
  updateDisplayWindows();
});

watch(() => props.selectedDate, async () => {
  // Check if the new date has been initialized
  const existingOneOff = oneOffWindows.value.filter(
    w => w.specificDate === selectedDateString.value
  );
  dayInitialized.value = existingOneOff.length > 0;
  
  updateDisplayWindows();
});
</script>

<style scoped>
.call-windows-card {
  background-color: #fcfcf9;
  border-radius: 8px;
  border: 1px solid #e4e4e4;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 700px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e4e4;
  background-color: #fcfcf9;
  flex-shrink: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #202020;
  margin: 0;
  text-align: left;
}

.card-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.button-divider {
  width: 1px;
  height: 20px;
  background-color: #d0d0d0;
  margin: 0 4px;
}

.action-btn {
  background: none;
  border: 1px solid #d0d0d0;
  border-radius: 50%;
  padding: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.action-btn:hover:not(:disabled) {
  background-color: rgba(32, 128, 141, 0.1);
  color: #20808d;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:focus {
  outline: none;
}

.add-btn {
  background-color: #20808d;
  color: white;
  border-color: #20808d;
}

.add-btn:hover {
  background-color: #1a6a75;
  border-color: #1a6a75;
  color: white;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.timeline-grid {
  display: flex;
  min-height: 1440px; /* 24 hours * 60px */
  position: relative;
}

.time-labels {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #e4e4e4;
}

.time-label {
  font-size: 11px;
  color: #666;
  padding: 4px 8px;
  text-align: right;
  border-bottom: 1px solid #e4e4e4;
}

.grid-area {
  flex: 1;
  position: relative;
  cursor: crosshair;
}

.hour-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e4e4e4;
  pointer-events: none;
}

.quarter-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #f0f0ec;
  pointer-events: none;
}

.call-window {
  position: absolute;
  left: 4px;
  right: 4px;
  background-color: rgba(32, 128, 141, 0.15);
  border: 2px solid #20808d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.call-window:hover {
  background-color: rgba(32, 128, 141, 0.25);
  border-color: #1a6a75;
}

.call-window.recurring-default {
  border-style: dashed;
  opacity: 0.7;
}

.call-window.drag-preview {
  opacity: 0.6;
  pointer-events: none;
}

.window-content {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 8px;
}

.window-time {
  font-size: 11px;
  font-weight: 500;
  color: #20808d;
  text-align: left;
  flex: 1;
}

.window-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #20808d;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.window-delete-btn:hover {
  background-color: rgba(32, 128, 141, 0.2);
  color: #1a6a75;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
  pointer-events: none;
}

.empty-icon {
  color: #e4e4e4;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.empty-hint-secondary {
  font-size: 12px;
  color: #999;
  margin: 8px 0 0 0;
}

.empty-hint-secondary a {
  color: #20808d;
  text-decoration: none;
  pointer-events: all;
}

.empty-hint-secondary a:hover {
  text-decoration: underline;
}
</style>
