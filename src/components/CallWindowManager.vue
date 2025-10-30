<template>
  <div class="call-window-manager">
    <!-- Timeline Container -->
    <div class="timeline-container" ref="timelineContainer">
      <div class="timeline-grid">
        <!-- Time Labels -->
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

        <!-- Grid Area with Lines and Windows -->
        <div 
          class="grid-area"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        >
          <!-- Hour Lines -->
          <div 
            v-for="hour in 24" 
            :key="`line-${hour}`" 
            class="hour-line"
            :style="{ top: `${(hour - 1) * HOUR_HEIGHT}px` }"
          />

          <!-- Quarter-Hour Lines -->
          <div 
            v-for="quarter in 96" 
            :key="`quarter-${quarter}`" 
            class="quarter-line"
            :style="{ top: `${(quarter - 1) * QUARTER_HEIGHT}px` }"
          />

          <!-- Existing Windows -->
          <div
            v-for="window in windows"
            :key="window.id"
            class="call-window"
            :class="{ 
              'recurring-default': window.isRecurringDefault,
              'hovered': hoveredWindow?.id === window.id 
            }"
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
                v-if="enableDelete && hoveredWindow?.id === window.id"
                class="window-delete-btn"
                @click.stop="handleDeleteWindow(window)"
                title="Delete window"
              >
                <v-icon size="14">mdi-delete</v-icon>
              </button>
            </div>
          </div>

          <!-- Drag Preview -->
          <div
            v-if="isDragging && previewWindow"
            class="call-window drag-preview"
            :style="getWindowStyle(previewWindow)"
          >
            <div class="window-content">
              <span class="window-time">
                {{ formatTime(previewWindow.startTime) }} - {{ formatTime(previewWindow.endTime) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="showEmptyState && windows.length === 0 && !isDragging" class="empty-state">
        <v-icon size="48" class="empty-icon">mdi-calendar-clock-outline</v-icon>
        <p class="empty-text">{{ emptyStateText || 'No call windows scheduled' }}</p>
        <p class="empty-hint">{{ emptyStateHint || 'Click and drag to create a window' }}</p>
        <slot name="empty-state-extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCallWindowManager, type CallWindow } from '@/composables/useCallWindowManager';

interface Props {
  windows: CallWindow[];
  baseDate: Date;
  readonly?: boolean;
  showEmptyState?: boolean;
  emptyStateText?: string;
  emptyStateHint?: string;
  enableDrag?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showEmptyState: true,
  enableDrag: true,
  enableEdit: true,
  enableDelete: true,
});

const emit = defineEmits<{
  'window-create': [{ startTime: Date; endTime: Date }];
  'window-delete': [CallWindow];
  'window-click': [CallWindow];
  'merge-needed': [{ newWindow: { startTime: Date; endTime: Date }; overlapping: CallWindow[] }];
}>();

// Use composable
const {
  HOUR_HEIGHT,
  QUARTER_HEIGHT,
  isDragging,
  previewWindow,
  formatHour,
  formatTime,
  getWindowStyle,
  findOverlappingWindows,
  startDrag,
  updateDrag,
  endDrag,
  cancelDrag,
} = useCallWindowManager({
  userId: '', // Not needed for this component
  enableUndo: false, // Undo handled by parent
});

// Local state
const timelineContainer = ref<HTMLElement | null>(null);
const hoveredWindow = ref<CallWindow | null>(null);

// Mouse event handlers
const handleMouseDown = (e: MouseEvent) => {
  if (props.readonly || !props.enableDrag) return;
  if (e.target !== e.currentTarget) return; // Only start from empty space

  const container = timelineContainer.value;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  
  startDrag(e.clientY, rect.top, scrollTop, props.baseDate);
};

const handleMouseMove = (e: MouseEvent) => {
  if (props.readonly || !props.enableDrag) return;
  if (!isDragging.value) return;

  const container = timelineContainer.value;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  
  updateDrag(e.clientY, rect.top, scrollTop, props.baseDate);
};

const handleMouseUp = () => {
  if (props.readonly || !props.enableDrag) return;
  if (!isDragging.value) return;

  const result = endDrag();
  if (!result) return;

  // Check for overlaps
  const overlapping = findOverlappingWindows(result);
  
  if (overlapping.length > 0) {
    // Emit merge-needed event
    emit('merge-needed', { newWindow: result, overlapping });
  } else {
    // No overlap, create directly
    emit('window-create', result);
  }
};

const handleMouseLeave = () => {
  if (props.readonly || !props.enableDrag) return;
  cancelDrag();
};

const handleWindowClick = (window: CallWindow) => {
  if (props.readonly || !props.enableEdit) return;
  emit('window-click', window);
};

const handleDeleteWindow = (window: CallWindow) => {
  if (props.readonly || !props.enableDelete) return;
  hoveredWindow.value = null;
  emit('window-delete', window);
};

// Update windows in composable when prop changes
import { watch } from 'vue';
const { windows: composableWindows } = useCallWindowManager({ userId: '', enableUndo: false });
watch(() => props.windows, (newWindows) => {
  composableWindows.value = newWindows;
}, { immediate: true });
</script>

<style scoped>
.call-window-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  background: white;
  position: relative;
}

.timeline-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  position: relative;
  min-height: 100%;
}

.time-labels {
  border-right: 1px solid #e4e4e4;
  background: #fcfcf9;
}

.time-label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 12px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #e4e4e4;
  font-weight: 500;
}

.grid-area {
  position: relative;
  height: 1440px; /* 24 hours * 60px */
  cursor: crosshair;
  background: white;
}

.hour-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #e4e4e4;
  pointer-events: none;
}

.quarter-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #f0f0f0;
  pointer-events: none;
}

.call-window {
  position: absolute;
  left: 8px;
  right: 8px;
  background: #20808d;
  border: 2px solid #20808d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 30px;
}

.call-window:hover {
  background: #1a6b76;
  border-color: #1a6b76;
  transform: translateX(2px);
}

.call-window.recurring-default {
  background: rgba(32, 128, 141, 0.6);
  border-style: dashed;
}

.call-window.drag-preview {
  background: rgba(32, 128, 141, 0.3);
  border: 2px dashed #20808d;
  cursor: default;
  pointer-events: none;
}

.call-window.drag-preview:hover {
  transform: none;
}

.window-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  height: 100%;
  gap: 8px;
}

.window-time {
  color: white;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  text-align: left;
}

.window-delete-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 3px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  color: white;
}

.window-delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  pointer-events: none;
  z-index: 1;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 14px;
  margin: 0;
}

.empty-hint-secondary {
  font-size: 14px;
  margin: 0.5rem 0 0 0;
}

.empty-hint-secondary a {
  color: #20808d;
  text-decoration: none;
  pointer-events: auto;
}

.empty-hint-secondary a:hover {
  text-decoration: underline;
}
</style>
