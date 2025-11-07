<template>
  <div class="call-windows-card" :class="{ 'completed': hasJournalEntry }">
    <!-- Completed Overlay -->
    <div v-if="hasJournalEntry" class="completed-overlay">
      <div class="completed-content">
        <v-icon size="48" color="#20808d">mdi-check-circle</v-icon>
        <h3>Call Completed</h3>
        <p>You've already completed your reflection call for this day</p>
      </div>
    </div>

    <!-- Header with controls -->
    <div class="card-header">
      <h3 class="card-title">Call Windows</h3>
      <div class="card-actions">
        <v-tooltip text="Add call window" location="bottom">
          <template v-slot:activator="{ props }">
            <button 
              class="action-btn add-btn" 
              @click="handleAddWindow"
              v-bind="props"
            >
              <v-icon size="16">mdi-plus</v-icon>
            </button>
          </template>
        </v-tooltip>
        <div class="button-divider"></div>
        <v-tooltip text="Undo last change" location="bottom">
          <template v-slot:activator="{ props }">
            <button 
              class="action-btn" 
              @click="handleUndo" 
              :disabled="!canUndo"
              v-bind="props"
            >
              <v-icon size="16">mdi-undo-variant</v-icon>
            </button>
          </template>
        </v-tooltip>
        <v-tooltip text="Redo last undone change" location="bottom">
          <template v-slot:activator="{ props }">
            <button 
              class="action-btn" 
              @click="handleRedo" 
              :disabled="!canRedo"
              v-bind="props"
            >
              <v-icon size="16">mdi-redo-variant</v-icon>
            </button>
          </template>
        </v-tooltip>
        <div class="button-divider"></div>
        <v-tooltip text="Reset to recurring windows" location="bottom">
          <template v-slot:activator="{ props }">
            <button 
              class="action-btn" 
              @click="handleReset"
              v-bind="props"
            >
              <v-icon size="16">mdi-refresh</v-icon>
            </button>
          </template>
        </v-tooltip>
        <v-tooltip text="Clear all windows for this day" location="bottom">
          <template v-slot:activator="{ props }">
            <button 
              class="action-btn" 
              @click="handleClear"
              v-bind="props"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
            </button>
          </template>
        </v-tooltip>
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
      :window="{ ...editingWindow, type: editingWindow.type || 'ONEOFF' }"
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
import { ref, computed, onMounted, watch, toRef } from 'vue';
import { api } from '@/services/api';
import CallWindowEditModal from './CallWindowEditModal.vue';
import CallWindowMergePrompt from './CallWindowMergePrompt.vue';
import { useDayCallWindows, type DisplayWindow } from '@/composables/useDayCallWindows';

interface Props {
  selectedDate: Date;
  userId: string;
}

const props = defineProps<Props>();

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
  findOverlappingWindows,
  ensureOneOffWindowsExist,
} = useDayCallWindows(toRef(props, 'userId'), toRef(props, 'selectedDate'));

// Constants
const HOUR_HEIGHT = 60; // pixels per hour
const QUARTER_HEIGHT = HOUR_HEIGHT / 4; // 15 pixels per 15 minutes
const MIN_WINDOW_DURATION = 5; // minimum 5 minutes

// UI State (not managed by composable)
const isDragging = ref(false);
const dragStart = ref<{ y: number; time: Date } | null>(null);
const dragPreview = ref<DisplayWindow | null>(null);
const hoveredWindow = ref<DisplayWindow | null>(null);
const timelineContainer = ref<HTMLElement | null>(null);
const showMergePrompt = ref(false);
const pendingWindow = ref<{ startTime: Date; endTime: Date } | null>(null);
const editingWindow = ref<DisplayWindow | null>(null);

// Day View specific state
const hasJournalEntry = ref(false);

// Computed date string for journal entry check
const selectedDateString = computed(() => {
  const year = props.selectedDate.getFullYear();
  const month = String(props.selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(props.selectedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// Check if selected date is today
const isToday = computed(() => {
  const today = new Date();
  return (
    props.selectedDate.getFullYear() === today.getFullYear() &&
    props.selectedDate.getMonth() === today.getMonth() &&
    props.selectedDate.getDate() === today.getDate()
  );
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
      // If overlapping with recurring windows, convert them to one-off first
      const hasRecurringOverlap = overlapping.some(w => w.type === undefined || w.isRecurringDefault);
      if (hasRecurringOverlap) {
        await ensureOneOffWindowsExist();
        await updateDisplayWindows();
      }
      
      // Show merge prompt
      pendingWindow.value = { startTime: window.startTime, endTime: window.endTime };
      showMergePrompt.value = true;
    } else {
      // No overlap, create directly
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

// Delegate to composable methods
const handleUndo = async () => await undo();
const handleRedo = async () => await redo();

const handleInitiateCall = () => {
  // TODO: Implement call initiation
  console.log('Initiating call...');
};

const handleMergeConfirm = async () => {
  if (!pendingWindow.value) return;
  
  await createWindow(pendingWindow.value.startTime, pendingWindow.value.endTime, true);
  showMergePrompt.value = false;
  pendingWindow.value = null;
};

const handleMergeCancel = () => {
  showMergePrompt.value = false;
  pendingWindow.value = null;
};

// Check if journal entry exists for the selected date
const checkJournalEntry = async () => {
  try {
    const result = await api.getEntryByDate(selectedDateString.value);
    // Backend returns { entry: JournalEntryDoc | null }
    if (result && typeof result === 'object' && 'entry' in result) {
      hasJournalEntry.value = !!(result as { entry: unknown }).entry && !('error' in result);
    } else {
      hasJournalEntry.value = false;
    }
  } catch (error) {
    hasJournalEntry.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await loadWindows();
  await checkJournalEntry();
});

watch(() => props.selectedDate, async () => {
  await checkJournalEntry();
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
  position: relative;
}

.call-windows-card.completed {
  pointer-events: none;
}

.call-windows-card.completed > *:not(.completed-overlay) {
  opacity: 0.4;
  filter: grayscale(0.5);
}

.completed-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(252, 252, 249, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: auto;
}

.completed-content {
  text-align: center;
  padding: 2rem;
}

.completed-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #202020;
  margin: 1rem 0 0.5rem;
}

.completed-content p {
  font-size: 1rem;
  color: #666;
  margin: 0;
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
