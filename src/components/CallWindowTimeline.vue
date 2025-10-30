<template>
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
          v-for="window in windows"
          :key="window.id"
          class="call-window"
          :style="getWindowStyle(window)"
          @click="$emit('window-click', window)"
        >
          <div class="window-content">
            <div class="window-time">{{ formatTimeRange(window.startTime, window.endTime) }}</div>
            <button
              v-if="!readonly"
              class="delete-icon"
              @click.stop="$emit('window-delete', window)"
              title="Delete window"
            >
              <v-icon size="14">mdi-close</v-icon>
            </button>
          </div>
        </div>

        <!-- Preview window during drag -->
        <div
          v-if="previewWindow"
          class="call-window preview"
          :style="{ top: `${previewWindow.top}px`, height: `${previewWindow.height}px` }"
        >
          <div class="window-content">
            <div class="window-time">
              {{ formatTimeRange(previewWindow.startTime, previewWindow.endTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCallWindowTimeline, TimeWindow } from '@/composables/useCallWindowTimeline';

interface Props {
  windows: TimeWindow[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  'window-create': [{ startTime: number; endTime: number }];
  'window-click': [TimeWindow];
  'window-delete': [TimeWindow];
}>();

const timelineContainer = ref<HTMLElement | null>(null);

const {
  HOUR_HEIGHT,
  QUARTER_HEIGHT,
  previewWindow,
  formatHour,
  formatTimeRange,
  getWindowStyle,
  startDrag,
  updateDrag,
  endDrag,
  cancelDrag,
} = useCallWindowTimeline();

const handleMouseDown = (e: MouseEvent) => {
  if (props.readonly) return;
  
  const container = timelineContainer.value?.querySelector('.grid-area');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  startDrag(e.clientY, rect.top);
};

const handleMouseMove = (e: MouseEvent) => {
  if (props.readonly) return;
  
  const container = timelineContainer.value?.querySelector('.grid-area');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  updateDrag(e.clientY, rect.top);
};

const handleMouseUp = () => {
  if (props.readonly) return;
  
  const result = endDrag();
  if (result) {
    emit('window-create', result);
  }
};

const handleMouseLeave = () => {
  if (props.readonly) return;
  cancelDrag();
};
</script>

<style scoped>
.timeline-container {
  max-height: 700px;
  overflow-y: auto;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  background: white;
}

.timeline-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  position: relative;
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

.call-window.preview {
  background: rgba(32, 128, 141, 0.3);
  border: 2px dashed #20808d;
  cursor: default;
}

.call-window.preview:hover {
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

.delete-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 3px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.call-window:hover .delete-icon {
  opacity: 1;
}

.delete-icon:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
