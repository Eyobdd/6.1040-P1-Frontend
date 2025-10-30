import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useDayCallWindows } from './useDayCallWindows';
import { api } from '@/services/api';

// Mock the API
vi.mock('@/services/api', () => ({
  api: {
    getUserRecurringWindows: vi.fn(),
    getUserOneOffWindows: vi.fn(),
    createOneOffCallWindow: vi.fn(),
    deleteOneOffCallWindow: vi.fn(),
    mergeOverlappingOneOffWindows: vi.fn(),
    setDayModeCustom: vi.fn(),
    setDayModeRecurring: vi.fn(),
    shouldUseRecurring: vi.fn(),
  },
}));

describe('useDayCallWindows', () => {
  const mockRecurringWindows = [
    {
      _id: 'rec1',
      user: 'testUser',
      windowType: 'RECURRING' as const,
      dayOfWeek: 'FRIDAY',
      startTime: '2025-01-01T14:00:00.000Z',
      endTime: '2025-01-01T15:00:00.000Z',
    },
    {
      _id: 'rec2',
      user: 'testUser',
      windowType: 'RECURRING' as const,
      dayOfWeek: 'FRIDAY',
      startTime: '2025-01-01T19:00:00.000Z',
      endTime: '2025-01-01T20:00:00.000Z',
    },
  ];

  const mockOneOffWindows = [
    {
      _id: 'oneoff1',
      user: 'testUser',
      windowType: 'ONEOFF' as const,
      specificDate: '2025-10-24',
      startTime: '2025-10-24T16:00:00.000Z',
      endTime: '2025-10-24T17:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getUserRecurringWindows).mockResolvedValue(mockRecurringWindows);
    vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);
    vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);
  });

  describe('Initialization', () => {
    it('initializes with empty display windows', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { displayWindows } = useDayCallWindows(userId, selectedDate);

      expect(displayWindows.value).toEqual([]);
    });

    it('initializes with undo/redo disabled', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { canUndo, canRedo } = useDayCallWindows(userId, selectedDate);

      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(false);
    });

    it('computes correct date string', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { selectedDateString } = useDayCallWindows(userId, selectedDate);

      expect(selectedDateString.value).toBe('2025-10-24');
    });

    it('computes correct day of week', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24')); // Friday

      const { selectedDayOfWeek } = useDayCallWindows(userId, selectedDate);

      expect(selectedDayOfWeek.value).toBe('FRIDAY');
    });
  });

  describe('Loading Windows', () => {
    it('loads recurring and one-off windows', async () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { loadWindows } = useDayCallWindows(userId, selectedDate);

      await loadWindows();

      expect(api.getUserRecurringWindows).toHaveBeenCalledWith('testUser');
      expect(api.getUserOneOffWindows).toHaveBeenCalledWith('testUser');
    });

    it('updates display windows after loading', async () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { loadWindows, displayWindows } = useDayCallWindows(userId, selectedDate);

      await loadWindows();

      expect(displayWindows.value.length).toBeGreaterThan(0);
    });
  });

  describe('Day Mode - Recurring vs Custom', () => {
    it('shows recurring windows in recurring mode', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { loadWindows, displayWindows } = useDayCallWindows(userId, selectedDate);

      await loadWindows();

      expect(displayWindows.value.length).toBe(2); // 2 recurring windows
      expect(displayWindows.value[0].isRecurringDefault).toBe(true);
    });

    it('shows one-off windows in custom mode', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { loadWindows, displayWindows } = useDayCallWindows(userId, selectedDate);

      await loadWindows();

      expect(displayWindows.value.length).toBe(1); // 1 one-off window
      expect(displayWindows.value[0].type).toBe('ONEOFF');
    });

    it('shows empty in custom mode when cleared', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { loadWindows, displayWindows } = useDayCallWindows(userId, selectedDate);

      await loadWindows();

      expect(displayWindows.value.length).toBe(0);
    });
  });

  describe('Creating Windows', () => {
    it('switches to custom mode when creating first window', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);
      vi.mocked(api.setDayModeCustom).mockResolvedValue({ dayMode: 'mode1' });
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { createWindow } = useDayCallWindows(userId, selectedDate);

      const startTime = new Date('2025-10-24T16:00:00.000Z');
      const endTime = new Date('2025-10-24T17:00:00.000Z');

      await createWindow(startTime, endTime);

      expect(api.setDayModeCustom).toHaveBeenCalledWith('testUser', '2025-10-24');
    });

    it('creates window without switching mode if already custom', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { createWindow } = useDayCallWindows(userId, selectedDate);

      const startTime = new Date('2025-10-24T16:00:00.000Z');
      const endTime = new Date('2025-10-24T17:00:00.000Z');

      await createWindow(startTime, endTime);

      expect(api.setDayModeCustom).not.toHaveBeenCalled();
      expect(api.createOneOffCallWindow).toHaveBeenCalled();
    });

    it('uses merge API when shouldMerge is true', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.mergeOverlappingOneOffWindows).mockResolvedValue({ callWindow: 'merged1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { createWindow } = useDayCallWindows(userId, selectedDate);

      const startTime = new Date('2025-10-24T16:00:00.000Z');
      const endTime = new Date('2025-10-24T17:00:00.000Z');

      await createWindow(startTime, endTime, true); // shouldMerge = true

      expect(api.mergeOverlappingOneOffWindows).toHaveBeenCalled();
      expect(api.createOneOffCallWindow).not.toHaveBeenCalled();
    });
  });

  describe('Deleting Windows', () => {
    it('deletes window and updates display', async () => {
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { deleteWindow } = useDayCallWindows(userId, selectedDate);

      const window = {
        id: 'oneoff1',
        startTime: new Date('2025-10-24T16:00:00.000Z'),
        endTime: new Date('2025-10-24T17:00:00.000Z'),
        type: 'ONEOFF' as const,
      };

      await deleteWindow(window);

      expect(api.deleteOneOffCallWindow).toHaveBeenCalledWith(
        'testUser',
        '2025-10-24',
        window.startTime
      );
    });
  });

  describe('Clear Action', () => {
    it('switches to custom mode when clearing from recurring', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);
      vi.mocked(api.setDayModeCustom).mockResolvedValue({ dayMode: 'mode1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { handleClear } = useDayCallWindows(userId, selectedDate);

      await handleClear();

      expect(api.setDayModeCustom).toHaveBeenCalledWith('testUser', '2025-10-24');
    });

    it('stays in custom mode when clearing from custom', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { handleClear } = useDayCallWindows(userId, selectedDate);

      await handleClear();

      expect(api.setDayModeCustom).not.toHaveBeenCalled();
      expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
    });

    it('deletes all one-off windows for the day', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { handleClear } = useDayCallWindows(userId, selectedDate);

      await handleClear();

      expect(api.deleteOneOffCallWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset Action', () => {
    it('switches to recurring mode', async () => {
      vi.mocked(api.setDayModeRecurring).mockResolvedValue({ dayMode: 'mode1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { handleReset } = useDayCallWindows(userId, selectedDate);

      await handleReset();

      expect(api.setDayModeRecurring).toHaveBeenCalledWith('testUser', '2025-10-24');
    });

    it('deletes all one-off windows', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { handleReset } = useDayCallWindows(userId, selectedDate);

      await handleReset();

      expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
    });
  });

  describe('Undo/Redo', () => {
    it('enables undo after creating window', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { createWindow, canUndo } = useDayCallWindows(userId, selectedDate);

      expect(canUndo.value).toBe(false);

      await createWindow(
        new Date('2025-10-24T16:00:00.000Z'),
        new Date('2025-10-24T17:00:00.000Z')
      );

      expect(canUndo.value).toBe(true);
    });

    it('clears redo stack on new action', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { createWindow, canRedo } = useDayCallWindows(userId, selectedDate);

      await createWindow(
        new Date('2025-10-24T16:00:00.000Z'),
        new Date('2025-10-24T17:00:00.000Z')
      );

      expect(canRedo.value).toBe(false);
    });
  });

  describe('Overlap Detection', () => {
    it('detects overlapping windows', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { checkOverlap } = useDayCallWindows(userId, selectedDate);

      const window1 = {
        startTime: new Date('2025-10-24T12:00:00.000Z'),
        endTime: new Date('2025-10-24T13:00:00.000Z'),
      };

      const window2 = {
        startTime: new Date('2025-10-24T12:30:00.000Z'),
        endTime: new Date('2025-10-24T13:30:00.000Z'),
      };

      expect(checkOverlap(window1, window2)).toBe(true);
    });

    it('detects non-overlapping windows', () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { checkOverlap } = useDayCallWindows(userId, selectedDate);

      const window1 = {
        startTime: new Date('2025-10-24T09:00:00.000Z'),
        endTime: new Date('2025-10-24T10:00:00.000Z'),
      };

      const window2 = {
        startTime: new Date('2025-10-24T14:00:00.000Z'),
        endTime: new Date('2025-10-24T15:00:00.000Z'),
      };

      expect(checkOverlap(window1, window2)).toBe(false);
    });
  });

  describe('Date Changes', () => {
    it('resets state when date changes', async () => {
      const userId = ref('testUser');
      const selectedDate = ref(new Date('2025-10-24'));

      const { canUndo, createWindow } = useDayCallWindows(userId, selectedDate);

      // Create a window to enable undo
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      await createWindow(
        new Date('2025-10-24T16:00:00.000Z'),
        new Date('2025-10-24T17:00:00.000Z')
      );

      expect(canUndo.value).toBe(true);

      // Change date
      selectedDate.value = new Date('2025-10-25');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Undo should be reset
      expect(canUndo.value).toBe(false);
    });
  });
});
