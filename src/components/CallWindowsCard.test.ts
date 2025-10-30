import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import CallWindowsCard from './CallWindowsCard.vue';
import { api } from '@/services/api';

// Mock the API
vi.mock('@/services/api', () => ({
  api: {
    getUserRecurringWindows: vi.fn(),
    getUserOneOffWindows: vi.fn(),
    createOneOffCallWindow: vi.fn(),
    deleteOneOffCallWindow: vi.fn(),
    mergeOverlappingOneOffWindows: vi.fn(),
    getEntryByDate: vi.fn(),
    setDayModeCustom: vi.fn(),
    setDayModeRecurring: vi.fn(),
    shouldUseRecurring: vi.fn(),
  },
}));

const vuetify = createVuetify();

describe('CallWindowsCard.vue - Current Implementation', () => {
  // Create date at noon to avoid timezone issues
  const createTestDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(12, 0, 0, 0);
    return date;
  };

  const defaultProps = {
    selectedDate: createTestDate('2025-10-24'), // A Friday at noon
    userId: 'testUser',
  };

  const mockRecurringWindows = [
    {
      _id: 'rec1',
      user: 'testUser',
      windowType: 'RECURRING',
      dayOfWeek: 'FRIDAY',
      startTime: '2025-01-01T14:00:00.000Z', // 9 AM EST
      endTime: '2025-01-01T15:00:00.000Z',
    },
  ];

  const mockOneOffWindows = [
    {
      _id: 'oneoff1',
      user: 'testUser',
      windowType: 'ONEOFF',
      specificDate: '2025-10-24',
      startTime: '2025-10-24T16:00:00.000Z', // 12 PM EST
      endTime: '2025-10-24T17:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: recurring mode, no one-off windows, no journal entry
    vi.mocked(api.getUserRecurringWindows).mockResolvedValue(mockRecurringWindows);
    vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);
  });

  describe('Component Rendering', () => {
    it('renders with title and all buttons', async () => {
      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wrapper.text()).toContain('Call Windows');
      expect(wrapper.find('[title="Add window"]').exists()).toBe(true);
      expect(wrapper.find('[title="Undo"]').exists()).toBe(true);
      expect(wrapper.find('[title="Redo"]').exists()).toBe(true);
      expect(wrapper.find('[title="Reset"]').exists()).toBe(true);
      expect(wrapper.find('[title="Clear"]').exists()).toBe(true);
    });

    it('renders 24-hour timeline', async () => {
      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();

      const timeLabels = wrapper.findAll('.time-label');
      expect(timeLabels.length).toBe(24); // 12 AM through 11 PM
    });

    it('shows empty state when no windows exist', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false); // Custom mode
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wrapper.text()).toContain('No call windows scheduled');
    });
  });

  describe('Day Mode - Recurring vs Custom', () => {
    it('shows recurring windows in recurring mode', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 300));

      const windows = wrapper.findAll('.call-window');
      expect(windows.length).toBeGreaterThan(0);
    });

    it('shows one-off windows in custom mode', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 300));

      const windows = wrapper.findAll('.call-window');
      expect(windows.length).toBeGreaterThan(0);
    });

    it('shows no windows in custom mode when cleared', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      const windows = wrapper.findAll('.call-window');
      expect(windows.length).toBe(0);
    });
  });

  describe('Clear Action', () => {
    it('calls setDayModeCustom when clearing from recurring mode', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(true);
      vi.mocked(api.setDayModeCustom).mockResolvedValue({ dayMode: 'mode1' });

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 200));

      const clearButton = wrapper.find('[title="Clear"]');
      await clearButton.trigger('click');

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should call setDayModeCustom with userId and some date string
      expect(api.setDayModeCustom).toHaveBeenCalledWith('testUser', expect.any(String));
    });

    it('stays in custom mode after clear', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      // Return windows initially so there's something to delete
      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce(mockOneOffWindows) // Initial load
        .mockResolvedValueOnce(mockOneOffWindows) // For syncOneOffWindows
        .mockResolvedValueOnce([]); // After clear

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 300));

      const clearButton = wrapper.find('[title="Clear"]');
      await clearButton.trigger('click');

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should NOT call setDayModeRecurring
      expect(api.setDayModeRecurring).not.toHaveBeenCalled();
      // Should delete windows
      expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
    });
  });

  describe('Reset Action', () => {
    it('calls setDayModeRecurring when resetting', async () => {
      vi.mocked(api.shouldUseRecurring).mockResolvedValue(false);
      // Return windows initially so there's something to delete
      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce(mockOneOffWindows) // Initial load
        .mockResolvedValueOnce(mockOneOffWindows) // For syncOneOffWindows
        .mockResolvedValueOnce([]); // After reset
      vi.mocked(api.setDayModeRecurring).mockResolvedValue({ dayMode: 'mode1' });

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 300));

      const resetButton = wrapper.find('[title="Reset"]');
      await resetButton.trigger('click');

      await wrapper.vm.$nextTick();
      await flushPromises();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(api.setDayModeRecurring).toHaveBeenCalledWith('testUser', expect.any(String));
      expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
    });
  });

  describe('Journal Entry Overlay', () => {
    it('shows completed overlay when journal entry exists', async () => {
      vi.mocked(api.getEntryByDate).mockResolvedValue({
        _id: 'entry1',
        user: 'testUser',
        date: '2025-10-24',
      });

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wrapper.find('.completed-overlay').exists()).toBe(true);
      expect(wrapper.text()).toContain('Call Completed');
    });

    it('does not show overlay when no journal entry', async () => {
      vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });

      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(wrapper.find('.completed-overlay').exists()).toBe(false);
    });
  });

  describe('Undo/Redo State', () => {
    it('disables undo button initially', async () => {
      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();

      const undoButton = wrapper.find('[title="Undo"]');
      expect(undoButton.attributes('disabled')).toBeDefined();
    });

    it('disables redo button initially', async () => {
      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await wrapper.vm.$nextTick();

      const redoButton = wrapper.find('[title="Redo"]');
      expect(redoButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('API Integration', () => {
    it('loads recurring windows on mount', async () => {
      mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(api.getUserRecurringWindows).toHaveBeenCalledWith('testUser');
    });

    it('loads one-off windows on mount', async () => {
      mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(api.getUserOneOffWindows).toHaveBeenCalledWith('testUser');
    });

    it('checks for journal entry on mount', async () => {
      mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(api.getEntryByDate).toHaveBeenCalledWith('testUser', expect.any(String));
    });

    it('checks day mode on mount', async () => {
      mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(api.shouldUseRecurring).toHaveBeenCalledWith('testUser', expect.any(String));
    });
  });

  describe('Date Changes', () => {
    it('reloads data when date changes', async () => {
      const wrapper = mount(CallWindowsCard, {
        props: defaultProps,
        global: { plugins: [vuetify] },
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      vi.clearAllMocks();

      // Change date
      await wrapper.setProps({ selectedDate: createTestDate('2025-10-25') });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(api.getUserRecurringWindows).toHaveBeenCalled();
      expect(api.getUserOneOffWindows).toHaveBeenCalled();
      expect(api.getEntryByDate).toHaveBeenCalledWith('testUser', expect.any(String));
    });
  });
});
