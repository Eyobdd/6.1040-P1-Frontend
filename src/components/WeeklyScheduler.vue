<template>
  <div class="weekly-scheduler">
    <!-- Header with navigation -->
    <div class="scheduler-header">
      <div class="header-left">
        <button class="nav-btn" @click="previousWeek" title="Previous week">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </button>
        <button class="nav-btn" @click="nextWeek" title="Next week">
          <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
        <h2 class="week-range">{{ weekRangeText }}</h2>
      </div>
      <div class="header-right">
        <button class="today-btn" @click="goToToday">Today</button>
      </div>
    </div>

    <!-- Week grid -->
    <div class="week-grid-container">
      <!-- Day headers -->
      <div class="day-headers">
        <div class="time-header"></div>
        <div
          v-for="day in weekDays"
          :key="day.dateString"
          class="day-header"
          :class="{ 'is-today': day.isToday }"
          @click="selectDay(day.date)"
        >
          <div class="day-name">{{ day.dayName }}</div>
          <div class="day-number">{{ day.dayNumber }}</div>
        </div>
      </div>

      <!-- Scrollable grid area -->
      <div class="grid-scroll-area" ref="gridScrollArea">
        <div class="time-grid">
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
              v-for="day in weekDays"
              :key="day.dateString"
              class="day-column"
              :class="{ 'is-today': day.isToday }"
              :data-date="day.dateString"
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
                @mousedown="handleMouseDown($event, day)"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseLeave"
              />

              <!-- Drag preview -->
              <div
                v-if="isDragging && dragDay?.dateString === day.dateString && dragPreview"
                class="call-window drag-preview"
                :style="getWindowStyle(dragPreview)"
              >
                <div class="window-time">{{ formatWindowTime(dragPreview) }}</div>
              </div>

              <!-- Call windows for this day -->
              <div
                v-for="window in day.windows"
                :key="window.id"
                class="call-window"
                :style="getWindowStyle(window)"
                @click="editWindow(window, day.date)"
                @mouseenter="hoveredWindow = window.id"
                @mouseleave="hoveredWindow = null"
              >
                <div class="window-time">{{ formatWindowTime(window) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <CallWindowEditModal
      v-if="editingWindow"
      :window="{ ...editingWindow, type: editingWindow.type || 'ONEOFF' }"
      :selectedDate="editingDate"
      @save="handleSaveEdit"
      @cancel="handleCancelEdit"
      @delete="handleDeleteFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDayCallWindows, type DisplayWindow } from '@/composables/useDayCallWindows';
import CallWindowEditModal from './CallWindowEditModal.vue';

interface Props {
  userId: string;
  initialDate?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  initialDate: () => new Date(),
});

// State
const currentWeekStart = ref(getWeekStart(props.initialDate));
const hoveredWindow = ref<string | null>(null);
const editingWindow = ref<DisplayWindow | null>(null);
const editingDate = ref<Date>(new Date());
const gridScrollArea = ref<HTMLElement | null>(null);

// Drag state
const isDragging = ref(false);
const dragStart = ref<{ y: number; time: Date } | null>(null);
const dragPreview = ref<DisplayWindow | null>(null);
const dragDay = ref<{ date: Date; dateString: string } | null>(null);

// Constants
const hourHeight = 60;
const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Computed
const weekDays = computed(() => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value);
    date.setDate(date.getDate() + i);
    
    const dateString = formatDateString(date);
    const isToday = date.getTime() === today.getTime();

    // Get windows for this day using composable
    const { displayWindows, loadWindows } = useDayCallWindows(
      computed(() => props.userId),
      computed(() => date)
    );

    // Load windows for this day
    loadWindows();

    days.push({
      date,
      dateString,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday,
      windows: displayWindows.value,
    });
  }

  return days;
});

const weekRangeText = computed(() => {
  const start = currentWeekStart.value;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  } else {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  }
});

// Methods
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday = 0
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatWindowTime(window: DisplayWindow): string {
  const start = window.startTime;
  const end = window.endTime;
  
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

function getWindowStyle(window: DisplayWindow) {
  const startMinutes = window.startTime.getHours() * 60 + window.startTime.getMinutes();
  const endMinutes = window.endTime.getHours() * 60 + window.endTime.getMinutes();
  const duration = endMinutes - startMinutes;
  
  const top = (startMinutes / 60) * hourHeight;
  const height = (duration / 60) * hourHeight;
  
  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
}

function nextWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
}

function goToToday() {
  currentWeekStart.value = getWeekStart(new Date());
  scrollToCurrentTime();
}

function selectDay(date: Date) {
  // Emit event or navigate to single day view
  console.log('Selected day:', date);
}

function editWindow(window: DisplayWindow, date: Date) {
  editingWindow.value = window;
  editingDate.value = date;
}

function handleSaveEdit(updatedWindow: DisplayWindow) {
  // Handle save through composable
  editingWindow.value = null;
}

function handleCancelEdit() {
  editingWindow.value = null;
}

function handleDeleteFromModal() {
  // Handle delete through composable
  editingWindow.value = null;
}

function scrollToCurrentTime() {
  if (!gridScrollArea.value) return;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scrollPosition = (currentMinutes / 60) * hourHeight - 100; // Offset for visibility
  
  gridScrollArea.value.scrollTop = Math.max(0, scrollPosition);
}

// Drag-to-create handlers
function timeFromY(y: number, dayColumn: HTMLElement): Date {
  const rect = dayColumn.getBoundingClientRect();
  const scrollTop = gridScrollArea.value?.scrollTop || 0;
  const relativeY = y - rect.top + scrollTop;
  const totalMinutes = (relativeY / hourHeight) * 60;
  
  // Snap to 5-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 5) * 5;
  const clampedMinutes = Math.max(0, Math.min(1440, snappedMinutes));
  
  const date = new Date(dragDay.value!.date);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(clampedMinutes);
  
  return date;
}

function handleMouseDown(e: MouseEvent, day: any) {
  // Only start drag from empty space
  if (e.target !== e.currentTarget) return;
  
  isDragging.value = true;
  dragDay.value = day;
  
  const dayColumn = e.currentTarget as HTMLElement;
  const startTime = timeFromY(e.clientY, dayColumn);
  dragStart.value = { y: e.clientY, time: startTime };
  
  dragPreview.value = {
    id: 'preview',
    startTime,
    endTime: new Date(startTime.getTime() + 15 * 60 * 1000), // 15 minutes
    type: 'ONEOFF',
  };
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !dragStart.value || !dragPreview.value || !dragDay.value) return;
  
  const dayColumn = document.querySelector(`[data-date="${dragDay.value.dateString}"]`) as HTMLElement;
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
  
  const window = dragPreview.value;
  const duration = (window.endTime.getTime() - window.startTime.getTime()) / (1000 * 60);
  
  const MIN_WINDOW_DURATION = 5; // 5 minutes
  
  if (duration >= MIN_WINDOW_DURATION) {
    // Create window for this day
    const { createWindow } = useDayCallWindows(
      computed(() => props.userId),
      computed(() => dragDay.value!.date)
    );
    
    await createWindow(window.startTime, window.endTime);
  }
  
  isDragging.value = false;
  dragStart.value = null;
  dragPreview.value = null;
  dragDay.value = null;
}

function handleMouseLeave() {
  if (isDragging.value) {
    isDragging.value = false;
    dragStart.value = null;
    dragPreview.value = null;
    dragDay.value = null;
  }
}

// Lifecycle
onMounted(() => {
  scrollToCurrentTime();
});
</script>

<style scoped>
.weekly-scheduler {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
}

/* Header */
.scheduler-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: #f5f5f5;
  border-color: #d4d4d4;
}

.week-range {
  font-size: 20px;
  font-weight: 600;
  color: #171717;
  margin: 0;
}

.today-btn {
  padding: 8px 16px;
  border: 1px solid #20808d;
  border-radius: 6px;
  background: #ffffff;
  color: #20808d;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background: #20808d;
  color: #ffffff;
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
  padding: 16px 8px;
  text-align: center;
  border-right: 1px solid #e5e5e5;
  cursor: pointer;
  transition: background 0.2s ease;
}

.day-header:hover {
  background: #f5f5f5;
}

.day-header.is-today {
  background: #fef3c7;
  border-left: 2px solid #fbbf24;
  border-right: 2px solid #fbbf24;
}

.day-name {
  font-size: 12px;
  font-weight: 600;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.day-header.is-today .day-name {
  color: #92400e;
}

.day-number {
  font-size: 24px;
  font-weight: 600;
  color: #171717;
}

.day-header.is-today .day-number {
  color: #92400e;
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
  position: relative;
  min-height: 1440px; /* 24 hours * 60px */
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

.day-column.is-today {
  background: #fffbeb;
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

/* Call windows */
.call-window {
  position: absolute;
  left: 4px;
  right: 4px;
  background: #20808d;
  border: 1px solid #1a6b76;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.call-window:hover {
  background: #1a6b76;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  z-index: 10;
}

.window-time {
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Scrollbar styling */
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

/* Drag preview */
.drag-preview {
  opacity: 0.7;
  pointer-events: none;
  z-index: 100;
}
</style>
