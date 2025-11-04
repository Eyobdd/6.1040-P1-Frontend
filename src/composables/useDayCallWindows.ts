import { ref, computed, type Ref, watch } from 'vue';
import { api } from '@/services/api';

export interface DisplayWindow {
  id: string;
  startTime: Date;
  endTime: Date;
  type?: 'ONEOFF' | 'RECURRING';
  isRecurringDefault?: boolean;
}

interface RecurringWindow {
  _id: string;
  user: string;
  windowType: 'RECURRING';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface OneOffWindow {
  _id: string;
  user: string;
  windowType: 'ONEOFF';
  specificDate: string;
  startTime: string;
  endTime: string;
}

interface UndoState {
  windows: OneOffWindow[];
  action: string;
}

/**
 * Composable for managing call windows for a specific day
 * Handles recurring vs custom mode, CRUD operations, undo/redo
 */
export function useDayCallWindows(userId: Ref<string>, selectedDate: Ref<Date>) {
  // State
  const displayWindows = ref<DisplayWindow[]>([]);
  const recurringWindows = ref<RecurringWindow[]>([]);
  const oneOffWindows = ref<OneOffWindow[]>([]);
  const dayInitialized = ref(false);
  const undoStack = ref<UndoState[]>([]);
  const redoStack = ref<UndoState[]>([]);

  // Computed
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const selectedDateString = computed(() => {
    const year = selectedDate.value.getFullYear();
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const selectedDayOfWeek = computed(() => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[selectedDate.value.getDay()];
  });

  // Undo/Redo
  const pushUndo = (action: string) => {
    undoStack.value.push({
      windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
      action,
    });
    redoStack.value = []; // Clear redo stack on new action
  };

  const undo = async () => {
    if (undoStack.value.length === 0) return;

    // Save current state to redo stack
    redoStack.value.push({
      windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
      action: 'undo',
    });

    const lastState = undoStack.value.pop()!;
    oneOffWindows.value = lastState.windows;
    await syncOneOffWindows();
    await updateDisplayWindows();
  };

  const redo = async () => {
    if (redoStack.value.length === 0) return;

    // Save current state to undo stack
    undoStack.value.push({
      windows: JSON.parse(JSON.stringify(oneOffWindows.value)),
      action: 'redo',
    });

    const lastState = redoStack.value.pop()!;
    oneOffWindows.value = lastState.windows;
    await syncOneOffWindows();
    await updateDisplayWindows();
  };

  // Window Operations
  const loadRecurringWindows = async () => {
    const result = await api.getUserRecurringWindows(userId.value);
    // Backend returns { windows: [...] }
    const windowsArray = (result as any)?.windows || result;
    if (Array.isArray(windowsArray)) {
      recurringWindows.value = windowsArray;
    }
  };

  const loadOneOffWindows = async () => {
    const result = await api.getUserOneOffWindows(userId.value);
    // Backend returns { windows: [...] }
    const windowsArray = (result as any)?.windows || result;
    if (Array.isArray(windowsArray)) {
      oneOffWindows.value = windowsArray;
    }
  };

  const loadWindows = async () => {
    await loadRecurringWindows();
    await loadOneOffWindows();
    await updateDisplayWindows();
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

      // Set the date to the selected date (using UTC to match how times are stored)
      const dateStart = new Date(selectedDate.value);
      dateStart.setHours(startTime.getUTCHours(), startTime.getUTCMinutes(), 0, 0);

      const dateEnd = new Date(selectedDate.value);
      dateEnd.setHours(endTime.getUTCHours(), endTime.getUTCMinutes(), 0, 0);

      await api.createOneOffCallWindow(
        selectedDateString.value,
        dateStart,
        dateEnd
      );
    }

    await loadOneOffWindows();
  };

  const syncOneOffWindows = async () => {
    // First, get current windows from backend to know what to delete
    const backendResult = await api.getUserOneOffWindows(userId.value);
    // Backend returns { windows: [...] }
    const windowsArray = (backendResult as any)?.windows || backendResult;
    const backendWindows = Array.isArray(windowsArray) ? windowsArray : [];
    
    // Delete all one-off windows for this date from backend
    const windowsToDelete = backendWindows.filter(
      w => w.specificDate === selectedDateString.value
    );

    for (const window of windowsToDelete) {
      await api.deleteOneOffCallWindow(
        selectedDateString.value,
        new Date(window.startTime)
      );
    }

    // Recreate from current local state
    const windowsToCreate = oneOffWindows.value.filter(
      w => w.specificDate === selectedDateString.value
    );

    for (const window of windowsToCreate) {
      await api.createOneOffCallWindow(
        selectedDateString.value,
        new Date(window.startTime),
        new Date(window.endTime)
      );
    }
  };

  const updateDisplayWindows = async () => {
    const windows: DisplayWindow[] = [];

    // Check if we should use recurring or custom (one-off) windows
    const result = await api.shouldUseRecurring(selectedDateString.value);
    // Backend returns { useRecurring: boolean }
    const useRecurring = (result as any)?.useRecurring ?? result;

    if (useRecurring) {
      // Default mode: Show recurring windows
      const dayRecurring = recurringWindows.value.filter(
        w => w.dayOfWeek === selectedDayOfWeek.value
      );

      for (const window of dayRecurring) {
        // Parse the time - handle both ISO strings and Date objects
        const startTime = typeof window.startTime === 'string' 
          ? new Date(window.startTime) 
          : new Date(window.startTime);
        const endTime = typeof window.endTime === 'string'
          ? new Date(window.endTime)
          : new Date(window.endTime);

        // Set the date to the selected date (using UTC to match how times are stored)
        const dateStart = new Date(selectedDate.value);
        dateStart.setHours(startTime.getUTCHours(), startTime.getUTCMinutes(), 0, 0);

        const dateEnd = new Date(selectedDate.value);
        dateEnd.setHours(endTime.getUTCHours(), endTime.getUTCMinutes(), 0, 0);

        windows.push({
          id: window._id,
          startTime: dateStart,
          endTime: dateEnd,
          type: undefined, // Recurring windows don't have a type
          isRecurringDefault: true,
        });
      }
    } else {
      // Custom mode: Show one-off windows (might be empty if cleared)
      const dateOneOff = oneOffWindows.value.filter(
        w => w.specificDate === selectedDateString.value
      );

      for (const window of dateOneOff) {
        const startTime = new Date(window.startTime);
        const endTime = new Date(window.endTime);

        // Set the date component
        startTime.setFullYear(selectedDate.value.getFullYear());
        startTime.setMonth(selectedDate.value.getMonth());
        startTime.setDate(selectedDate.value.getDate());

        endTime.setFullYear(selectedDate.value.getFullYear());
        endTime.setMonth(selectedDate.value.getMonth());
        endTime.setDate(selectedDate.value.getDate());

        windows.push({
          id: window._id,
          startTime,
          endTime,
          type: 'ONEOFF',
        });
      }
    }

    displayWindows.value = windows;
  };

  const createWindow = async (startTime: Date, endTime: Date, shouldMerge: boolean = false) => {
    // Check if we're in recurring mode - if so, switch to custom mode
    const result = await api.shouldUseRecurring(selectedDateString.value);
    const useRecurring = (result as any)?.useRecurring ?? result;
    if (useRecurring) {
      // Convert recurring to one-off and switch to custom mode
      await ensureOneOffWindowsExist();
      await api.setDayModeCustom(selectedDateString.value);
      dayInitialized.value = true;
    }

    // If already in custom mode but not initialized, just mark as initialized
    if (!dayInitialized.value) {
      dayInitialized.value = true;
    }

    // Save current state for undo BEFORE making changes
    pushUndo('create');

    let createResult;
    if (shouldMerge) {
      // Merge overlapping windows using backend
      createResult = await api.mergeOverlappingOneOffWindows(
        selectedDateString.value,
        startTime,
        endTime
      );
    } else {
      // No overlap, create normally
      createResult = await api.createOneOffCallWindow(
        selectedDateString.value,
        startTime,
        endTime
      );
    }

    if ('error' in createResult) {
      console.error('Failed to create window:', createResult.error);
      undoStack.value.pop(); // Remove undo entry on failure
      return;
    }

    await loadOneOffWindows();
    await updateDisplayWindows();
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

    await api.deleteOneOffCallWindow(
      selectedDateString.value,
      window.startTime
    );

    await loadOneOffWindows();
    await updateDisplayWindows();
  };

  const handleReset = async () => {
    // RESET: Remove all one-off windows and switch back to recurring mode

    // Save current state for undo
    pushUndo('reset');

    // Delete all one-off windows for this date from backend
    const windowsToDelete = oneOffWindows.value.filter(
      w => w.specificDate === selectedDateString.value
    );

    for (const window of windowsToDelete) {
      await api.deleteOneOffCallWindow(
        selectedDateString.value,
        new Date(window.startTime)
      );
    }

    // Clear all one-off windows for this date from local state
    oneOffWindows.value = oneOffWindows.value.filter(
      w => w.specificDate !== selectedDateString.value
    );

    // Set day mode back to recurring (default)
    await api.setDayModeRecurring(selectedDateString.value);

    // Mark as uninitialized so recurring windows show again
    dayInitialized.value = false;

    await updateDisplayWindows();
  };

  const handleClear = async () => {
    // CLEAR: Remove all windows but stay in custom mode (don't show recurring)

    // Save current state for undo
    pushUndo('clear');

    // First, ensure we're in custom mode (convert recurring if needed)
    const result = await api.shouldUseRecurring(selectedDateString.value);
    const useRecurring = (result as any)?.useRecurring ?? result;
    if (useRecurring) {
      // Convert recurring to one-off first
      await ensureOneOffWindowsExist();
      // Set to custom mode
      await api.setDayModeCustom(selectedDateString.value);
    }

    // Now delete all one-off windows for this date from backend
    const windowsToDelete = oneOffWindows.value.filter(
      w => w.specificDate === selectedDateString.value
    );

    for (const window of windowsToDelete) {
      await api.deleteOneOffCallWindow(
        selectedDateString.value,
        new Date(window.startTime)
      );
    }

    // Clear all windows for this date from local state
    oneOffWindows.value = oneOffWindows.value.filter(
      w => w.specificDate !== selectedDateString.value
    );

    // Keep initialized flag true - day is in custom mode
    dayInitialized.value = true;

    await updateDisplayWindows();
  };

  // Overlap detection
  const checkOverlap = (window1: { startTime: Date; endTime: Date }, window2: { startTime: Date; endTime: Date }): boolean => {
    return window1.startTime < window2.endTime && window1.endTime > window2.startTime;
  };

  const findOverlappingWindows = (newWindow: { startTime: Date; endTime: Date }): DisplayWindow[] => {
    return displayWindows.value.filter(w => checkOverlap(newWindow, w));
  };

  // Watch for date changes
  watch(selectedDate, async () => {
    dayInitialized.value = false;
    undoStack.value = [];
    redoStack.value = [];
    await loadWindows();
  });

  return {
    // State
    displayWindows,
    canUndo,
    canRedo,

    // Methods
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

    // Computed
    selectedDateString,
    selectedDayOfWeek,
  };
}
