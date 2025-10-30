<template>
  <div class="recurring-week-scheduler">
    <!-- Controls bar -->
    <div class="controls-bar">
      <button class="control-btn" @click="handleUndo" :disabled="!canUndo" title="Undo">
        <v-icon size="18">mdi-undo-variant</v-icon>
      </button>
      <button class="control-btn" @click="handleRedo" :disabled="!canRedo" title="Redo">
        <v-icon size="18">mdi-redo-variant</v-icon>
      </button>
      <button class="add-btn" @click="showAddModal = true">
        <v-icon size="18">mdi-plus</v-icon>
        Add Window
      </button>
    </div>

    <!-- Week grid -->
    <div class="week-grid-container">
      <!-- Scrollable grid area -->
      <div class="grid-scroll-area" ref="gridScrollArea">
        <div class="time-grid">
          <!-- Sticky header row -->
          <div class="time-header sticky-header"></div>
          <div
            v-for="day in daysOfWeek"
            :key="`header-${day.value}`"
            class="day-header sticky-header"
          >
            <div class="day-name">{{ day.label }}</div>
            <button 
              class="clear-btn" 
              @click="clearDay(day.value)"
              :disabled="getWindowsForDay(day.value).length === 0"
              title="Clear"
            >
              Clear
            </button>
          </div>

          <!-- Time labels column -->
          <div class="time-labels">
            <div
              v-for="hour in 24"
              :key="hour"
              class="time-label"
              :style="{ height: `${hourHeight}px` }"
            >
              {{ formatHourLabel(hour - 1) }}
            </div>
          </div>

          <!-- Day columns -->
          <div class="day-columns">
            <div
              v-for="day in daysOfWeek"
              :key="day.value"
              class="day-column"
              :data-day="day.value"
            >
              <!-- Hour grid lines -->
              <div
                v-for="hour in 24"
                :key="`line-${hour}`"
                class="hour-line"
                :style="{ top: `${(hour - 1) * hourHeight}px` }"
              />

              <!-- Half-hour lines -->
              <div
                v-for="half in 48"
                :key="`half-${half}`"
                class="half-hour-line"
                :style="{ top: `${(half - 1) * (hourHeight / 2)}px` }"
              />

              <!-- Drag-to-create area -->
              <div
                class="drag-area"
                @mousedown="handleMouseDown($event, day.value)"
              />

              <!-- Drag preview -->
              <div
                v-if="isDragging && dragDay === day.value && dragPreview"
                class="call-window drag-preview"
                :style="getWindowStyle(dragPreview)"
              >
                <div class="window-time">{{ formatWindowTime(dragPreview) }}</div>
              </div>

              <!-- Call windows for this day -->
              <div
                v-for="window in getWindowsForDay(day.value)"
                :key="window.id"
                class="call-window"
                :class="{ 'hovered': hoveredWindow === window.id }"
                :style="getWindowStyle(window)"
                @click="editWindow(window, day.value)"
                @mouseenter="hoveredWindow = window.id"
                @mouseleave="hoveredWindow = null"
              >
                <div class="window-content">
                  <span class="window-time">{{ formatWindowTime(window) }}</span>
                  <button
                    v-if="hoveredWindow === window.id"
                    class="window-delete-btn"
                    @click.stop="handleDeleteWindow(window)"
                    title="Delete window"
                  >
                    <v-icon size="14">mdi-delete</v-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <RecurringWindowAddModal
      v-if="showAddModal"
      @save="handleAddWindow"
      @cancel="showAddModal = false"
    />

    <!-- Edit Modal -->
    <RecurringWindowEditModal
      v-if="editingWindow"
      :window="editingWindow"
      :dayOfWeek="editingDay"
      @save="handleSaveEdit"
      @cancel="handleCancelEdit"
      @delete="handleDeleteFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/services/api';
import RecurringWindowAddModal from './RecurringWindowAddModal.vue';
import RecurringWindowEditModal from './RecurringWindowEditModal.vue';

type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

interface RecurringWindow {
  id: string;
  startTime: number; // minutes from midnight
  endTime: number;
  dayOfWeek: DayOfWeek;
}

interface Props {
  userId: string;
}

const props = defineProps<Props>();

// State
const windows = ref<RecurringWindow[]>([]);
const undoStack = ref<RecurringWindow[][]>([]);
const redoStack = ref<RecurringWindow[][]>([]);
const gridScrollArea = ref<HTMLElement | null>(null);
const showAddModal = ref(false);
const editingWindow = ref<RecurringWindow | null>(null);
const editingDay = ref<DayOfWeek>('MONDAY');
const hoveredWindow = ref<string | null>(null);

// Drag state
const isDragging = ref(false);
const dragStart = ref<{ y: number; time: number } | null>(null);
const dragPreview = ref<{ startTime: number; endTime: number } | null>(null);
const dragDay = ref<DayOfWeek | null>(null);

// Constants
const hourHeight = 60;
const daysOfWeek = [
  { label: 'Mon', value: 'MONDAY' as DayOfWeek },
  { label: 'Tue', value: 'TUESDAY' as DayOfWeek },
  { label: 'Wed', value: 'WEDNESDAY' as DayOfWeek },
  { label: 'Thu', value: 'THURSDAY' as DayOfWeek },
  { label: 'Fri', value: 'FRIDAY' as DayOfWeek },
  { label: 'Sat', value: 'SATURDAY' as DayOfWeek },
  { label: 'Sun', value: 'SUNDAY' as DayOfWeek },
];

// Computed
const canUndo = computed(() => undoStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);

// Methods
function getWindowsForDay(day: DayOfWeek): RecurringWindow[] {
  return windows.value.filter(w => w.dayOfWeek === day);
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatWindowTime(window: { startTime: number; endTime: number }): string {
  const formatTime = (minutes: number) => {
    // Ensure minutes is a valid number
    if (typeof minutes !== 'number' || isNaN(minutes)) {
      return '12:00 AM';
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = mins.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return `${formatTime(window.startTime)} - ${formatTime(window.endTime)}`;
}

function getWindowStyle(window: { startTime: number; endTime: number }) {
  const top = (window.startTime / 60) * hourHeight;
  const height = ((window.endTime - window.startTime) / 60) * hourHeight;
  
  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

function pushUndo() {
  undoStack.value.push(JSON.parse(JSON.stringify(windows.value)));
  redoStack.value = []; // Clear redo on new action
  
  // Limit undo stack to 10
  if (undoStack.value.length > 10) {
    undoStack.value.shift();
  }
}

async function handleUndo() {
  if (undoStack.value.length === 0) return;
  
  redoStack.value.push(JSON.parse(JSON.stringify(windows.value)));
  windows.value = undoStack.value.pop()!;
  await syncToBackend();
}

async function handleRedo() {
  if (redoStack.value.length === 0) return;
  
  undoStack.value.push(JSON.parse(JSON.stringify(windows.value)));
  windows.value = redoStack.value.pop()!;
  await syncToBackend();
}

async function clearDay(day: DayOfWeek) {
  const dayWindows = getWindowsForDay(day);
  if (dayWindows.length === 0) return;
  
  pushUndo();
  windows.value = windows.value.filter(w => w.dayOfWeek !== day);
  await syncToBackend();
}

async function handleAddWindow(data: { days: DayOfWeek[]; startTime: number; endTime: number }) {
  showAddModal.value = false; // Close immediately
  pushUndo();
  
  for (const day of data.days) {
    const newWindow: RecurringWindow = {
      id: `temp-${Date.now()}-${Math.random()}`,
      dayOfWeek: day,
      startTime: data.startTime,
      endTime: data.endTime,
    };
    windows.value.push(newWindow);
    
    // Automatically merge overlapping windows for this day
    mergeOverlappingWindows(day);
  }
  
  await syncToBackend();
}

function editWindow(window: RecurringWindow, day: DayOfWeek) {
  editingWindow.value = window;
  editingDay.value = day;
}

async function handleSaveEdit(data: { startTime: number; endTime: number }) {
  if (!editingWindow.value) return;
  
  const windowToEdit = editingWindow.value;
  const day = windowToEdit.dayOfWeek;
  editingWindow.value = null; // Close immediately
  
  pushUndo();
  const index = windows.value.findIndex(w => w.id === windowToEdit.id);
  if (index !== -1) {
    windows.value[index] = {
      ...windows.value[index],
      startTime: data.startTime,
      endTime: data.endTime,
    };
    
    // Automatically merge overlapping windows for this day
    mergeOverlappingWindows(day);
  }
  await syncToBackend();
}

function handleCancelEdit() {
  editingWindow.value = null;
}

async function handleDeleteWindow(window: RecurringWindow) {
  pushUndo();
  windows.value = windows.value.filter(w => w.id !== window.id);
  await syncToBackend();
}

async function handleDeleteFromModal() {
  if (!editingWindow.value) return;
  
  const windowToDelete = editingWindow.value;
  editingWindow.value = null; // Close immediately
  
  pushUndo();
  windows.value = windows.value.filter(w => w.id !== windowToDelete.id);
  await syncToBackend();
}

// Drag handlers
function timeFromY(y: number, dayColumn: HTMLElement): number {
  if (!gridScrollArea.value) return 0;
  
  // Get the sticky header to determine its height
  const stickyHeader = gridScrollArea.value.querySelector('.sticky-header') as HTMLElement;
  const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
  
  const gridRect = gridScrollArea.value.getBoundingClientRect();
  const scrollTop = gridScrollArea.value.scrollTop;
  
  // Subtract header height from the calculation since it's sticky and not part of the scrollable content
  const relativeY = y - gridRect.top + scrollTop - headerHeight;
  const totalMinutes = (relativeY / hourHeight) * 60;
  
  // Snap to 5-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 5) * 5;
  return Math.max(0, Math.min(1440, snappedMinutes));
}

function handleMouseDown(e: MouseEvent, day: DayOfWeek) {
  if (e.target !== e.currentTarget) return;
  
  // Prevent starting new drag if already dragging
  if (isDragging.value) return;
  
  e.preventDefault(); // Prevent text selection
  
  isDragging.value = true;
  dragDay.value = day;
  
  const dayColumn = e.currentTarget as HTMLElement;
  const startTime = timeFromY(e.clientY, dayColumn);
  dragStart.value = { y: e.clientY, time: startTime };
  
  dragPreview.value = {
    startTime,
    endTime: startTime + 15, // 15 minutes
  };
  
  // Add global mouse listeners
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !dragStart.value || !dragPreview.value || !dragDay.value) return;
  
  const dayColumn = document.querySelector(`[data-day="${dragDay.value}"]`) as HTMLElement;
  if (!dayColumn) return;
  
  const currentTime = timeFromY(e.clientY, dayColumn);
  const startTime = dragStart.value.time;
  
  if (currentTime > startTime) {
    dragPreview.value.startTime = startTime;
    dragPreview.value.endTime = currentTime;
  } else {
    dragPreview.value.startTime = currentTime;
    dragPreview.value.endTime = startTime;
  }
}

async function handleMouseUp(e: MouseEvent) {
  if (!isDragging.value || !dragPreview.value || !dragDay.value) return;
  
  // Cleanup FIRST to prevent re-triggering
  const preview = dragPreview.value;
  const day = dragDay.value;
  
  isDragging.value = false;
  dragStart.value = null;
  dragPreview.value = null;
  dragDay.value = null;
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  
  // Then process the window creation
  const duration = preview.endTime - preview.startTime;
  const MIN_DURATION = 5; // 5 minutes
  
  if (duration >= MIN_DURATION) {
    pushUndo();
    const newWindow: RecurringWindow = {
      id: `temp-${Date.now()}-${Math.random()}`,
      dayOfWeek: day,
      startTime: preview.startTime,
      endTime: preview.endTime,
    };
    windows.value.push(newWindow);
    
    // Automatically merge overlapping windows
    mergeOverlappingWindows(day);
    
    await syncToBackend();
  }
}

// Helper to convert ISO time string to minutes from midnight
function timeStringToMinutes(timeString: string): number {
  const date = new Date(timeString);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

// Helper to convert minutes from midnight to Date object
function minutesToDate(minutes: number): Date {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setUTCHours(hours, mins, 0, 0);
  return date;
}

// Check if two windows overlap
function windowsOverlap(w1: { startTime: number; endTime: number }, w2: { startTime: number; endTime: number }): boolean {
  return w1.startTime < w2.endTime && w2.startTime < w1.endTime;
}

// Merge overlapping windows for a specific day
function mergeOverlappingWindows(day: DayOfWeek) {
  const dayWindows = getWindowsForDay(day);
  if (dayWindows.length <= 1) return;
  
  let merged = false;
  
  for (let i = 0; i < dayWindows.length; i++) {
    for (let j = i + 1; j < dayWindows.length; j++) {
      if (windowsOverlap(dayWindows[i], dayWindows[j])) {
        // Merge windows
        const mergedWindow = {
          ...dayWindows[i],
          startTime: Math.min(dayWindows[i].startTime, dayWindows[j].startTime),
          endTime: Math.max(dayWindows[i].endTime, dayWindows[j].endTime),
        };
        
        // Remove both windows and add merged one
        windows.value = windows.value.filter(w => w.id !== dayWindows[i].id && w.id !== dayWindows[j].id);
        windows.value.push(mergedWindow);
        merged = true;
        break;
      }
    }
    if (merged) break;
  }
  
  // Recursively merge until no more overlaps
  if (merged) {
    mergeOverlappingWindows(day);
  }
}

// Backend sync
async function loadWindows() {
  const result = await api.getUserRecurringWindows(props.userId);
  
  if (Array.isArray(result)) {
    windows.value = result.map((w: any) => ({
      id: w._id,
      dayOfWeek: w.dayOfWeek,
      startTime: timeStringToMinutes(w.startTime),
      endTime: timeStringToMinutes(w.endTime),
    }));
  }
}

async function syncToBackend() {
  // Delete all existing recurring windows
  const existing = await api.getUserRecurringWindows(props.userId);
  if (Array.isArray(existing)) {
    for (const window of existing) {
      await api.deleteRecurringCallWindow(props.userId, window.dayOfWeek, new Date(window.startTime));
    }
  }
  
  // Create all current windows
  for (const window of windows.value) {
    await api.createRecurringCallWindow(
      props.userId,
      window.dayOfWeek,
      minutesToDate(window.startTime),
      minutesToDate(window.endTime)
    );
  }
  
  // Reload to get proper IDs
  await loadWindows();
}

// Lifecycle
onMounted(async () => {
  await loadWindows();
});
</script>

<style scoped>
.recurring-week-scheduler {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
}

/* Controls bar */
.controls-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.control-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #d4d4d4;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #20808d;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: #1a6b76;
}

/* Week grid container */
.week-grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Day headers */
.day-headers {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 2px solid #e5e5e5;
  background: #fafafa;
}

.time-header {
  border-right: 1px solid #e5e5e5;
}

.day-header {
  padding: 12px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-right: 1px solid #e5e5e5;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-size: 14px;
  font-weight: 600;
  color: #171717;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-btn {
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #737373;
}

.clear-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #d4d4d4;
  color: #171717;
}

.clear-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Grid scroll area */
.grid-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.time-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  grid-auto-rows: auto;
  position: relative;
  min-height: 1440px;
}

/* Sticky headers */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fafafa;
  border-bottom: 2px solid #e5e5e5;
}

.time-header {
  border-right: 1px solid #e5e5e5;
}

.day-header {
  padding: 12px 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-right: 1px solid #e5e5e5;
}

.day-header:last-child {
  border-right: none;
}

.day-name {
  font-size: 13px;
  font-weight: 600;
  color: #171717;
}

.clear-btn {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #737373;
}

.clear-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #d4d4d4;
  color: #171717;
}

.clear-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Time labels */
.time-labels {
  border-right: 1px solid #e5e5e5;
  background: #fafafa;
}

.time-label {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  font-size: 12px;
  color: #737373;
  font-weight: 500;
}

/* Day columns */
.day-columns {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-column: 2 / -1;
}

.day-column {
  position: relative;
  border-right: 1px solid #e5e5e5;
}

.day-column:last-child {
  border-right: none;
}

/* Grid lines */
.hour-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e5e5;
  pointer-events: none;
}

.half-hour-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #f5f5f5;
  pointer-events: none;
}

/* Drag area */
.drag-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: crosshair;
  z-index: 1;
}

/* Call windows */
.call-window {
  position: absolute;
  left: 4px;
  right: 4px;
  background: #b8dfe3;
  border: 2px solid #20808d;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  z-index: 2;
}

.call-window.hovered {
  background: #a0d4d9;
  border-color: #1a6b76;
  z-index: 5;
}

.drag-preview {
  opacity: 0.7;
  pointer-events: none;
  z-index: 100;
  background: #20808d;
  border-color: #1a6b76;
}

.window-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.window-time {
  font-size: 12px;
  font-weight: 500;
  color: #0f4d56;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.drag-preview .window-time {
  color: #ffffff;
}

.window-delete-btn {
  background: transparent;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20808d;
  transition: color 0.2s;
  flex-shrink: 0;
}

.window-delete-btn:hover {
  color: #dc2626;
}

/* Scrollbar */
.grid-scroll-area::-webkit-scrollbar {
  width: 8px;
}

.grid-scroll-area::-webkit-scrollbar-track {
  background: #fafafa;
}

.grid-scroll-area::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 4px;
}

.grid-scroll-area::-webkit-scrollbar-thumb:hover {
  background: #a3a3a3;
}
</style>
