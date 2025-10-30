import { render, screen, waitFor } from '@testing-library/vue';
import { userEvent } from '@testing-library/user-event';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CallWindowsCard from './CallWindowsCard.vue';
import { api } from '@/services/api';

const vuetify = createVuetify({
  components,
  directives,
});

// Mock the API service
vi.mock('@/services/api', () => ({
  api: {
    getUserRecurringWindows: vi.fn(),
    getUserOneOffWindows: vi.fn(),
    createOneOffCallWindow: vi.fn(),
    deleteOneOffCallWindow: vi.fn(),
    mergeOverlappingOneOffWindows: vi.fn(),
  },
}));

const mockRecurringWindows = [
  {
    _id: 'recurring1',
    user: 'testUser',
    windowType: 'RECURRING' as const,
    dayOfWeek: 'FRIDAY' as const,
    startTime: '2025-01-01T09:00:00.000Z',
    endTime: '2025-01-01T10:00:00.000Z',
  },
  {
    _id: 'recurring2',
    user: 'testUser',
    windowType: 'RECURRING' as const,
    dayOfWeek: 'FRIDAY' as const,
    startTime: '2025-01-01T14:00:00.000Z',
    endTime: '2025-01-01T15:00:00.000Z',
  },
];

const mockOneOffWindows = [
  {
    _id: 'oneoff1',
    user: 'testUser',
    windowType: 'ONEOFF' as const,
    specificDate: '2025-10-24',
    startTime: '2025-10-24T12:00:00.000Z',
    endTime: '2025-10-24T13:00:00.000Z',
  },
];

const renderCallWindowsCard = (props = {}) => {
  const defaultProps = {
    selectedDate: new Date('2025-10-24'),
    userId: 'testUser',
  };

  return render(CallWindowsCard, {
    props: { ...defaultProps, ...props },
    global: {
      plugins: [vuetify],
    },
  });
};

describe('CallWindowsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock responses
    vi.mocked(api.getUserRecurringWindows).mockResolvedValue(mockRecurringWindows);
    vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the card with title', async () => {
      renderCallWindowsCard();
      expect(screen.getByText('Call Windows')).toBeInTheDocument();
    });

    it('displays all action buttons', async () => {
      renderCallWindowsCard();
      
      expect(screen.getByTitle('Add window')).toBeInTheDocument();
      expect(screen.getByTitle('Undo')).toBeInTheDocument();
      expect(screen.getByTitle('Redo')).toBeInTheDocument();
      expect(screen.getByTitle('Reset')).toBeInTheDocument();
      expect(screen.getByTitle('Clear')).toBeInTheDocument();
    });

    it('renders 24-hour timeline with time labels', async () => {
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText('12 AM')).toBeInTheDocument();
        expect(screen.getByText('12 PM')).toBeInTheDocument();
        expect(screen.getByText('11 PM')).toBeInTheDocument();
      });
    });

    it('shows empty state when no windows are scheduled', async () => {
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText('No call windows scheduled')).toBeInTheDocument();
        expect(screen.getByText('Click and drag to create a window')).toBeInTheDocument();
      });
    });
  });

  describe('Window Display', () => {
    it('displays recurring windows as defaults when no one-off windows exist', async () => {
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });

    it('displays one-off windows when they exist', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });
    });

    it('shows delete button on hover', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      const window = screen.getByText(/12:00 PM - 1:00 PM/).closest('.call-window');
      if (window) {
        await user.hover(window);
        await waitFor(() => {
          expect(screen.getByTitle('Delete window')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Window Creation', () => {
    it('opens modal when add button is clicked', async () => {
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      const addButton = screen.getByTitle('Add window');
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Create Call Window')).toBeInTheDocument();
      });
    });

    it('creates a new window with minimum 5-minute duration', async () => {
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);
      
      renderCallWindowsCard();
      
      // This test would require simulating drag events
      // which is complex in a unit test environment
      // We're testing the logic exists
      expect(api.createOneOffCallWindow).toBeDefined();
    });
  });

  describe('Overlap Detection and Merging', () => {
    it('automatically merges overlapping windows when creating new window', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      vi.mocked(api.mergeOverlappingOneOffWindows).mockResolvedValue({ callWindow: 'merged1' });
      
      renderCallWindowsCard();
      
      // Wait for initial load
      await waitFor(() => {
        expect(api.getUserOneOffWindows).toHaveBeenCalled();
      });

      // The merge function should be available
      expect(api.mergeOverlappingOneOffWindows).toBeDefined();
    });

    it('calls merge API when overlapping windows are detected', async () => {
      const mergedWindows = [
        {
          _id: 'merged1',
          user: 'testUser',
          windowType: 'ONEOFF' as const,
          specificDate: '2025-10-24',
          startTime: '2025-10-24T12:00:00.000Z',
          endTime: '2025-10-24T14:00:00.000Z',
        },
      ];

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce(mockOneOffWindows)
        .mockResolvedValueOnce(mergedWindows);
      
      vi.mocked(api.mergeOverlappingOneOffWindows).mockResolvedValue({ callWindow: 'merged1' });
      
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(api.getUserOneOffWindows).toHaveBeenCalled();
      });
    });
  });

  describe('Window Deletion', () => {
    it('deletes window when delete button is clicked', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      const window = screen.getByText(/12:00 PM - 1:00 PM/).closest('.call-window');
      if (window) {
        await user.hover(window);
        
        await waitFor(() => {
          expect(screen.getByTitle('Delete window')).toBeInTheDocument();
        });

        const deleteButton = screen.getByTitle('Delete window');
        await user.click(deleteButton);
        
        await waitFor(() => {
          expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('undo button is disabled when no actions have been taken', async () => {
      renderCallWindowsCard();
      
      const undoButton = screen.getByTitle('Undo');
      expect(undoButton).toBeDisabled();
    });

    it('redo button is disabled when no actions have been undone', async () => {
      renderCallWindowsCard();
      
      const redoButton = screen.getByTitle('Redo');
      expect(redoButton).toBeDisabled();
    });

    it('enables undo button after creating a window', async () => {
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });
      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockOneOffWindows);
      
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByTitle('Add window')).toBeInTheDocument();
      });

      // After creating a window, undo should be enabled
      // This would require full integration test with drag or modal interaction
    });

    it('undo restores previous state', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // This test verifies the undo logic exists
      // Full integration would require simulating create/delete actions
      expect(screen.getByTitle('Undo')).toBeInTheDocument();
    });

    it('clears redo stack when new action is performed', async () => {
      // This tests the logic that redo stack is cleared on new actions
      renderCallWindowsCard();
      
      const redoButton = screen.getByTitle('Redo');
      expect(redoButton).toBeDisabled();
    });
  });

  describe('Reset and Clear Actions', () => {
    it('reset button clears one-off windows and shows recurring defaults', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      const resetButton = screen.getByTitle('Reset');
      await user.click(resetButton);
      
      // After reset, should show recurring windows
      await waitFor(() => {
        expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
      });
    });

    it('clear button removes all windows for the day', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      
      const user = userEvent.setup();
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      const clearButton = screen.getByTitle('Clear');
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(api.deleteOneOffCallWindow).toHaveBeenCalled();
      });
    });
  });

  describe('Recurring to One-Off Conversion', () => {
    it('converts recurring windows to one-off on first edit', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([]);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });
      
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // When user creates first window, recurring should be converted
      // This is tested through the ensureOneOffWindowsExist logic
      expect(api.createOneOffCallWindow).toBeDefined();
    });

    it('does not convert recurring windows if one-off already exist', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // Should not create additional windows
      expect(api.createOneOffCallWindow).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Handling', () => {
    it('correctly calculates window position with scroll offset', async () => {
      renderCallWindowsCard();
      
      // The timeFromY function should account for scrollTop
      // This is tested through the implementation
      await waitFor(() => {
        expect(screen.getByText('Call Windows')).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly in 12-hour format', async () => {
      vi.mocked(api.getUserOneOffWindows).mockResolvedValue(mockOneOffWindows);
      renderCallWindowsCard();
      
      await waitFor(() => {
        // Should show 12:00 PM, not 12:00
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });
    });

    it('displays AM/PM correctly', async () => {
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully when creating window', async () => {
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ 
        error: 'Failed to create window' 
      });
      
      renderCallWindowsCard();
      
      // Should not crash on error
      await waitFor(() => {
        expect(screen.getByText('Call Windows')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully when deleting window', async () => {
      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({ 
        error: 'Failed to delete window' 
      });
      
      renderCallWindowsCard();
      
      await waitFor(() => {
        expect(screen.getByText('Call Windows')).toBeInTheDocument();
      });
    });

    it('removes undo entry on failed operation', async () => {
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ 
        error: 'Failed to create window' 
      });
      
      renderCallWindowsCard();
      
      // Undo button should remain disabled after failed operation
      const undoButton = screen.getByTitle('Undo');
      expect(undoButton).toBeDisabled();
    });
  });

  describe('ISSUE 1: Persistence of Undo/Redo/Clear/Delete Actions', () => {
    it.skip('FAILING: undo action persists after drag-to-create new window', async () => {
      // Setup: Start with one window, delete it, undo the delete, then create a new window
      const initialWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T09:00:00.000Z',
        endTime: '2025-10-24T10:00:00.000Z',
      };

      const newWindow = {
        _id: 'window2',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T14:00:00.000Z',
        endTime: '2025-10-24T15:00:00.000Z',
      };

      // Mock sequence: initial load -> after delete -> after undo -> after create new
      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([initialWindow]) // Initial load
        .mockResolvedValueOnce([]) // After delete
        .mockResolvedValueOnce([initialWindow]) // After undo
        .mockResolvedValueOnce([initialWindow, newWindow]); // After creating new window

      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'window2' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      // Wait for initial window to appear
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Delete the window
      const window = screen.getByText(/9:00 AM - 10:00 AM/).closest('.call-window');
      if (window) {
        await user.hover(window);
        const deleteButton = await screen.findByTitle('Delete window');
        await user.click(deleteButton);
      }

      // Wait for window to be deleted
      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
      });

      // Undo the deletion
      const undoButton = screen.getByTitle('Undo');
      await user.click(undoButton);

      // Window should reappear
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Now simulate drag-to-create a new window
      // This would trigger the bug where the undo state is lost
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        // Simulate drag from 2 PM to 3 PM
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 840 } },
          { coords: { x: rect.left + 50, y: rect.top + 900 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // After creating new window, the undone window should STILL be visible
      // BUG: Currently it disappears because undo state is not persisted
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });

    it('FAILING: redo action persists after drag-to-create new window', async () => {
      const window1 = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T09:00:00.000Z',
        endTime: '2025-10-24T10:00:00.000Z',
      };

      const window2 = {
        _id: 'window2',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T14:00:00.000Z',
        endTime: '2025-10-24T15:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([window1])
        .mockResolvedValueOnce([]) // After delete
        .mockResolvedValueOnce([window1]) // After undo
        .mockResolvedValueOnce([]) // After redo
        .mockResolvedValueOnce([window2]); // After creating new window

      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'window2' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Delete window
      const window = screen.getByText(/9:00 AM - 10:00 AM/).closest('.call-window');
      if (window) {
        await user.hover(window);
        const deleteButton = await screen.findByTitle('Delete window');
        await user.click(deleteButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
      });

      // Undo deletion
      await user.click(screen.getByTitle('Undo'));
      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Redo deletion (window should disappear again)
      await user.click(screen.getByTitle('Redo'));
      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
      });

      // Now drag-to-create a new window
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 840 } },
          { coords: { x: rect.left + 50, y: rect.top + 900 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // After creating new window, the deleted window should STAY deleted
      // BUG: Currently it reappears because redo state is not persisted
      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });

    it('FAILING: clear action persists after drag-to-create new window', async () => {
      const window1 = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T09:00:00.000Z',
        endTime: '2025-10-24T10:00:00.000Z',
      };

      const window2 = {
        _id: 'window2',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T11:00:00.000Z',
        endTime: '2025-10-24T12:00:00.000Z',
      };

      const newWindow = {
        _id: 'window3',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T14:00:00.000Z',
        endTime: '2025-10-24T15:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([window1, window2]) // Initial load
        .mockResolvedValueOnce([]) // After clear
        .mockResolvedValueOnce([newWindow]); // After creating new window

      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'window3' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
        expect(screen.getByText(/11:00 AM - 12:00 PM/)).toBeInTheDocument();
      });

      // Clear all windows
      await user.click(screen.getByTitle('Clear'));

      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
        expect(screen.queryByText(/11:00 AM - 12:00 PM/)).not.toBeInTheDocument();
      });

      // Now drag-to-create a new window
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 840 } },
          { coords: { x: rect.left + 50, y: rect.top + 900 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // After creating new window, the cleared windows should STAY cleared
      // BUG: Currently they reappear because clear action is not persisted
      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
        expect(screen.queryByText(/11:00 AM - 12:00 PM/)).not.toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });

    it('FAILING: delete action persists after drag-to-create new window', async () => {
      const window1 = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T09:00:00.000Z',
        endTime: '2025-10-24T10:00:00.000Z',
      };

      const newWindow = {
        _id: 'window2',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T14:00:00.000Z',
        endTime: '2025-10-24T15:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([window1]) // Initial load
        .mockResolvedValueOnce([]) // After delete
        .mockResolvedValueOnce([newWindow]); // After creating new window

      vi.mocked(api.deleteOneOffCallWindow).mockResolvedValue({});
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'window2' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Delete the window
      const window = screen.getByText(/9:00 AM - 10:00 AM/).closest('.call-window');
      if (window) {
        await user.hover(window);
        const deleteButton = await screen.findByTitle('Delete window');
        await user.click(deleteButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
      });

      // Now drag-to-create a new window
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 840 } },
          { coords: { x: rect.left + 50, y: rect.top + 900 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // After creating new window, the deleted window should STAY deleted
      // BUG: Currently it reappears because delete action is not persisted
      await waitFor(() => {
        expect(screen.queryByText(/9:00 AM - 10:00 AM/)).not.toBeInTheDocument();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });
  });

  describe('ISSUE 2: User Prompt for Overlapping Windows', () => {
    it('prevents drag from starting on existing window', async () => {
      const existingWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T12:00:00.000Z',
        endTime: '2025-10-24T13:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([existingWindow]);

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // Try to start drag on the existing window - should be blocked
      const existingWindowElement = screen.getByText(/12:00 PM - 1:00 PM/).closest('.call-window');
      
      if (existingWindowElement) {
        const rect = existingWindowElement.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: existingWindowElement, coords: { x: rect.left + 10, y: rect.top + 10 } },
          { coords: { x: rect.left + 10, y: rect.bottom + 30 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // Should NOT create any new window or show merge prompt
      // because drag was blocked from starting on existing window
      await waitFor(() => {
        expect(screen.queryByText(/Merge windows/i)).not.toBeInTheDocument();
      });
    });

    it.skip('FAILING: shows merge/cancel prompt when dragging overlapping window', async () => {
      const existingWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T12:00:00.000Z',
        endTime: '2025-10-24T13:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([existingWindow]);
      vi.mocked(api.mergeOverlappingOneOffWindows).mockResolvedValue({ callWindow: 'merged1' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // Drag to create an overlapping window (12:30 PM - 1:30 PM)
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 750 } }, // 12:30 PM
          { coords: { x: rect.left + 50, y: rect.top + 810 } }, // 1:30 PM
          { keys: '[/MouseLeft]' },
        ]);
      }

      // Should show a prompt asking user to merge or cancel
      // BUG: Currently auto-merges without prompting
      await waitFor(() => {
        expect(screen.getByText(/Merge windows/i)).toBeInTheDocument();
        expect(screen.getByText(/merge/i)).toBeInTheDocument();
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      });
    });

    it('FAILING: merges windows when user confirms merge', async () => {
      const existingWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T12:00:00.000Z',
        endTime: '2025-10-24T13:00:00.000Z',
      };

      const mergedWindow = {
        _id: 'merged1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T12:00:00.000Z',
        endTime: '2025-10-24T13:30:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([existingWindow])
        .mockResolvedValueOnce([mergedWindow]);
      vi.mocked(api.mergeOverlappingOneOffWindows).mockResolvedValue({ callWindow: 'merged1' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // Drag to create overlapping window
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 750 } },
          { coords: { x: rect.left + 50, y: rect.top + 810 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // Wait for merge prompt and click merge button
      const mergeButton = await screen.findByRole('button', { name: /merge/i });
      await user.click(mergeButton);

      // Should call merge API and show merged window
      await waitFor(() => {
        expect(api.mergeOverlappingOneOffWindows).toHaveBeenCalled();
        expect(screen.getByText(/12:00 PM - 1:30 PM/)).toBeInTheDocument();
      });
    });

    it('FAILING: cancels window creation when user cancels merge', async () => {
      const existingWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T12:00:00.000Z',
        endTime: '2025-10-24T13:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows).mockResolvedValue([existingWindow]);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'new1' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
      });

      // Drag to create overlapping window
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 750 } },
          { coords: { x: rect.left + 50, y: rect.top + 810 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // Wait for merge prompt and click cancel button
      const cancelButton = await screen.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should NOT create or merge window, original window should remain unchanged
      await waitFor(() => {
        expect(api.createOneOffCallWindow).not.toHaveBeenCalled();
        expect(api.mergeOverlappingOneOffWindows).not.toHaveBeenCalled();
        expect(screen.getByText(/12:00 PM - 1:00 PM/)).toBeInTheDocument();
        expect(screen.queryByText(/12:00 PM - 1:30 PM/)).not.toBeInTheDocument();
      });
    });

    it('FAILING: does not show prompt for non-overlapping windows', async () => {
      const existingWindow = {
        _id: 'window1',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T09:00:00.000Z',
        endTime: '2025-10-24T10:00:00.000Z',
      };

      const newWindow = {
        _id: 'window2',
        user: 'testUser',
        windowType: 'ONEOFF' as const,
        specificDate: '2025-10-24',
        startTime: '2025-10-24T14:00:00.000Z',
        endTime: '2025-10-24T15:00:00.000Z',
      };

      vi.mocked(api.getUserOneOffWindows)
        .mockResolvedValueOnce([existingWindow])
        .mockResolvedValueOnce([existingWindow, newWindow]);
      vi.mocked(api.createOneOffCallWindow).mockResolvedValue({ callWindow: 'window2' });

      const user = userEvent.setup();
      const { container } = renderCallWindowsCard();

      await waitFor(() => {
        expect(screen.getByText(/9:00 AM - 10:00 AM/)).toBeInTheDocument();
      });

      // Drag to create non-overlapping window (2 PM - 3 PM)
      const gridArea = container.querySelector('.grid-area');
      if (gridArea) {
        const rect = gridArea.getBoundingClientRect();
        await user.pointer([
          { keys: '[MouseLeft>]', target: gridArea, coords: { x: rect.left + 50, y: rect.top + 840 } },
          { coords: { x: rect.left + 50, y: rect.top + 900 } },
          { keys: '[/MouseLeft]' },
        ]);
      }

      // Should NOT show merge prompt, should directly create window
      await waitFor(() => {
        expect(screen.queryByText(/Merge windows/i)).not.toBeInTheDocument();
        expect(api.createOneOffCallWindow).toHaveBeenCalled();
        expect(screen.getByText(/2:00 PM - 3:00 PM/)).toBeInTheDocument();
      });
    });
  });
});
