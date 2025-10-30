/**
 * useCallWindowManager - Reusable Call Window Management Logic
 * 
 * This composable provides core functionality for managing call windows:
 * - Window CRUD operations
 * - Undo/Redo system
 * - Overlap detection
 * - Drag-to-create interactions
 * - Time formatting utilities
 * 
 * Can be used for both one-off and recurring windows.
 */

import { ref, computed, Ref } from 'vue';
import { api } from '@/services/api';

// Types
export interface CallWindow {
  id: string;
  startTime: Date;
  endTime: Date;
  type?: 'ONEOFF' | 'RECURRING';
  isRecurringDefault?: boolean;
}

export interface UndoState {
  windows: any[];
  action: string;
}

export interface UseCallWindowManagerOptions {
  userId: string;
  enableUndo?: boolean;
  maxUndoStack?: number;
  onWindowsChange?: (windows: CallWindow[]) => void;
}

// Constants
const HOUR_HEIGHT = 60; // pixels per hour
const QUARTER_HEIGHT = HOUR_HEIGHT / 4;
const MIN_WINDOW_DURATION = 5; // minutes

/**
 * Main composable function
 */
export function useCallWindowManager(options: UseCallWindowManagerOptions) {
  const {
    userId,
    enableUndo = true,
    maxUndoStack = 10,
    onWindowsChange,
  } = options;

  // State
  const windows = ref<CallWindow[]>([]);
  const undoStack = ref<UndoState[]>([]);
  const redoStack = ref<UndoState[]>([]);
  
  // Drag state
  const isDragging = ref(false);
  const dragStart = ref<{ y: number; time: Date } | null>(null);
  const previewWindow = ref<CallWindow | null>(null);

  // Computed
  const canUndo = computed(() => enableUndo && undoStack.value.length > 0);
  const canRedo = computed(() => enableUndo && redoStack.value.length > 0);

  // Utility Functions
  
  /**
   * Format hour for timeline labels (12-hour format)
   */
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  /**
   * Format time for window display (12-hour format with minutes)
   */
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  /**
   * Calculate CSS style for window positioning
   */
  const getWindowStyle = (window: CallWindow) => {
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

  /**
   * Convert Y coordinate to time
   */
  const timeFromY = (y: number, containerTop: number, scrollTop: number): Date => {
    const relativeY = y - containerTop + scrollTop;
    const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;
    
    // Snap to 5-minute intervals
    const snappedMinutes = Math.round(totalMinutes / 5) * 5;
    const clampedMinutes = Math.max(0, Math.min(1440, snappedMinutes));
    
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMinutes(clampedMinutes);
    
    return date;
  };

  // Overlap Detection

  /**
   * Check if two windows overlap
   */
  const checkOverlap = (w1: { startTime: Date; endTime: Date }, w2: { startTime: Date; endTime: Date }): boolean => {
    return w1.startTime < w2.endTime && w1.endTime > w2.startTime;
  };

  /**
   * Find all windows that overlap with given window
   */
  const findOverlappingWindows = (newWindow: { startTime: Date; endTime: Date }): CallWindow[] => {
    return windows.value.filter(w => checkOverlap(newWindow, w));
  };

  // Undo/Redo System

  /**
   * Push current state to undo stack
   */
  const pushUndo = (action: string, state: any[]) => {
    if (!enableUndo) return;

    undoStack.value.push({
      windows: JSON.parse(JSON.stringify(state)),
      action,
    });

    // Clear redo stack on new action
    redoStack.value = [];

    // Limit stack size
    if (undoStack.value.length > maxUndoStack) {
      undoStack.value.shift();
    }
  };

  /**
   * Undo last action
   */
  const undo = async (currentState: any[], applyState: (state: any[]) => Promise<void>) => {
    if (undoStack.value.length === 0) return;

    // Save current state to redo stack
    redoStack.value.push({
      windows: JSON.parse(JSON.stringify(currentState)),
      action: 'undo',
    });

    const lastState = undoStack.value.pop()!;
    await applyState(lastState.windows);
  };

  /**
   * Redo last undone action
   */
  const redo = async (currentState: any[], applyState: (state: any[]) => Promise<void>) => {
    if (redoStack.value.length === 0) return;

    // Save current state to undo stack
    undoStack.value.push({
      windows: JSON.parse(JSON.stringify(currentState)),
      action: 'redo',
    });

    const lastState = redoStack.value.pop()!;
    await applyState(lastState.windows);
  };

  // Drag Operations

  /**
   * Start drag operation
   */
  const startDrag = (y: number, containerTop: number, scrollTop: number, baseDate: Date) => {
    const time = timeFromY(y, containerTop, scrollTop);
    isDragging.value = true;
    dragStart.value = { y, time };

    const startTime = new Date(baseDate);
    startTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    
    const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 minutes default

    previewWindow.value = {
      id: 'preview',
      startTime,
      endTime,
      type: 'ONEOFF',
    };
  };

  /**
   * Update drag operation
   */
  const updateDrag = (y: number, containerTop: number, scrollTop: number, baseDate: Date) => {
    if (!isDragging.value || !dragStart.value || !previewWindow.value) return;

    const currentTime = timeFromY(y, containerTop, scrollTop);
    const startTime = dragStart.value.time;

    const start = new Date(baseDate);
    const end = new Date(baseDate);

    if (currentTime > startTime) {
      start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      end.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    } else {
      start.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
      end.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    }

    previewWindow.value.startTime = start;
    previewWindow.value.endTime = end;
  };

  /**
   * End drag operation and return window if valid
   */
  const endDrag = (): { startTime: Date; endTime: Date } | null => {
    if (!isDragging.value || !previewWindow.value) {
      cancelDrag();
      return null;
    }

    const window = previewWindow.value;
    const duration = (window.endTime.getTime() - window.startTime.getTime()) / (1000 * 60);

    isDragging.value = false;
    dragStart.value = null;
    previewWindow.value = null;

    if (duration >= MIN_WINDOW_DURATION) {
      return {
        startTime: window.startTime,
        endTime: window.endTime,
      };
    }

    return null;
  };

  /**
   * Cancel drag operation
   */
  const cancelDrag = () => {
    isDragging.value = false;
    dragStart.value = null;
    previewWindow.value = null;
  };

  // Return public API
  return {
    // Constants
    HOUR_HEIGHT,
    QUARTER_HEIGHT,
    MIN_WINDOW_DURATION,

    // State
    windows,
    isDragging,
    previewWindow,
    undoStack,
    redoStack,

    // Computed
    canUndo,
    canRedo,

    // Utilities
    formatHour,
    formatTime,
    getWindowStyle,
    timeFromY,

    // Overlap
    checkOverlap,
    findOverlappingWindows,

    // Undo/Redo
    pushUndo,
    undo,
    redo,

    // Drag
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  };
}
