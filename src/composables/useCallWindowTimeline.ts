import { ref, computed, type Ref } from 'vue';

export interface TimeWindow {
  id: string;
  startTime: number; // Hour in 24-hour format (0-23.75 for quarter-hour precision)
  endTime: number;
  isRecurring?: boolean;
}

export interface TimelineConfig {
  hourHeight?: number;
  minDuration?: number; // Minimum duration in hours
}

/**
 * Composable for managing call window timeline interactions
 * Handles drag-to-create, window display, and time calculations
 * Can be used for both one-off and recurring windows
 */
export function useCallWindowTimeline(config: TimelineConfig = {}) {
  const HOUR_HEIGHT = config.hourHeight || 60;
  const QUARTER_HEIGHT = HOUR_HEIGHT / 4;
  const MIN_DURATION = config.minDuration || 0.0833; // 5 minutes in hours

  // Drag state
  const isDragging = ref(false);
  const dragStart = ref<number | null>(null);
  const dragCurrent = ref<number | null>(null);

  // Preview window during drag
  const previewWindow = computed(() => {
    if (!isDragging.value || dragStart.value === null || dragCurrent.value === null) {
      return null;
    }

    const start = Math.min(dragStart.value, dragCurrent.value);
    const end = Math.max(dragStart.value, dragCurrent.value);
    const duration = end - start;

    if (duration < MIN_DURATION) {
      return null;
    }

    return {
      startTime: start,
      endTime: end,
      top: start * HOUR_HEIGHT,
      height: duration * HOUR_HEIGHT,
    };
  });

  /**
   * Convert Y coordinate to time (in hours, 0-24)
   */
  const yToTime = (y: number, containerTop: number): number => {
    const relativeY = y - containerTop;
    const time = relativeY / HOUR_HEIGHT;
    // Snap to nearest quarter hour
    return Math.round(time * 4) / 4;
  };

  /**
   * Format hour for display (12-hour format with AM/PM)
   */
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  /**
   * Format time range for display
   */
  const formatTimeRange = (startTime: number, endTime: number): string => {
    const formatTime = (time: number) => {
      const hour = Math.floor(time);
      const minutes = Math.round((time - hour) * 60);
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return minutes > 0 
        ? `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
        : `${displayHour} ${period}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  /**
   * Calculate display position for a window
   */
  const getWindowStyle = (window: TimeWindow) => {
    const top = window.startTime * HOUR_HEIGHT;
    const height = (window.endTime - window.startTime) * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  /**
   * Check if two windows overlap
   */
  const windowsOverlap = (w1: TimeWindow, w2: TimeWindow): boolean => {
    return w1.startTime < w2.endTime && w1.endTime > w2.startTime;
  };

  /**
   * Find all windows that overlap with a given window
   */
  const findOverlappingWindows = (
    window: TimeWindow,
    windows: TimeWindow[]
  ): TimeWindow[] => {
    return windows.filter(w => w.id !== window.id && windowsOverlap(w, window));
  };

  /**
   * Start drag operation
   */
  const startDrag = (y: number, containerTop: number) => {
    const time = yToTime(y, containerTop);
    isDragging.value = true;
    dragStart.value = time;
    dragCurrent.value = time;
  };

  /**
   * Update drag operation
   */
  const updateDrag = (y: number, containerTop: number) => {
    if (!isDragging.value) return;
    dragCurrent.value = yToTime(y, containerTop);
  };

  /**
   * End drag operation and return created window if valid
   */
  const endDrag = (): { startTime: number; endTime: number } | null => {
    if (!isDragging.value || dragStart.value === null || dragCurrent.value === null) {
      isDragging.value = false;
      dragStart.value = null;
      dragCurrent.value = null;
      return null;
    }

    const start = Math.min(dragStart.value, dragCurrent.value);
    const end = Math.max(dragStart.value, dragCurrent.value);
    const duration = end - start;

    isDragging.value = false;
    dragStart.value = null;
    dragCurrent.value = null;

    if (duration < MIN_DURATION) {
      return null;
    }

    return { startTime: start, endTime: end };
  };

  /**
   * Cancel drag operation
   */
  const cancelDrag = () => {
    isDragging.value = false;
    dragStart.value = null;
    dragCurrent.value = null;
  };

  return {
    // Constants
    HOUR_HEIGHT,
    QUARTER_HEIGHT,
    MIN_DURATION,

    // State
    isDragging,
    previewWindow,

    // Utilities
    formatHour,
    formatTimeRange,
    getWindowStyle,
    windowsOverlap,
    findOverlappingWindows,

    // Drag operations
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}
