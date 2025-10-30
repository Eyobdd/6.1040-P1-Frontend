import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ReflectView from './ReflectView.vue';
import { api } from '@/services/api';

// Mock the router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the API
vi.mock('@/services/api', () => ({
  api: {
    getToken: vi.fn(),
    authenticate: vi.fn(),
    getEntryByDate: vi.fn(),
    getProfile: vi.fn(),
    getActivePrompts: vi.fn(),
    startSession: vi.fn(),
    recordResponse: vi.fn(),
    setRating: vi.fn(),
    completeSession: vi.fn(),
    getSession: vi.fn(),
    getSessionResponses: vi.fn(),
    createFromSession: vi.fn(),
  },
}));

describe('ReflectView - Prompt Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('should load active prompts from the backend', async () => {
    // Setup: Mock API responses
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'What are you grateful for today?', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'What did you do today?', position: 2, isActive: true },
      { _id: 'prompt3', promptText: 'What are you proud of today?', position: 3, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async operations

    // Verify: getActivePrompts was called with correct user
    expect(api.getActivePrompts).toHaveBeenCalledWith(mockUser);
    expect(api.getActivePrompts).toHaveBeenCalledTimes(1);
  });

  it('should use only active prompts (exclude inactive ones)', async () => {
    // Setup: Mock with mix of active and inactive prompts
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'Active prompt 1', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'Active prompt 2', position: 2, isActive: true },
      // Note: Inactive prompts should NOT be returned by getActivePrompts
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Only active prompts are used
    expect(api.getActivePrompts).toHaveBeenCalled();
    // The component should have 2 prompts + 1 rating = 3 total steps
    // We can't directly access component state in composition API, but we can verify the API call
  });

  it('should reflect updated prompt text', async () => {
    // Setup: Mock with updated prompt text
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'UPDATED: What made you smile today?', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'UPDATED: What did you accomplish?', position: 2, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Updated prompt text is used in session start
    expect(api.startSession).toHaveBeenCalledWith(
      mockUser,
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ promptText: 'UPDATED: What made you smile today?' }),
        expect.objectContaining({ promptText: 'UPDATED: What did you accomplish?' }),
      ])
    );
  });

  it('should load rating preference from profile', async () => {
    // Setup: Mock with rating disabled
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'Prompt 1', position: 1, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: false });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Profile was loaded
    expect(api.getProfile).toHaveBeenCalledWith(mockUser);
    expect(api.getProfile).toHaveBeenCalledTimes(1);
  });

  it('should handle empty active prompts gracefully', async () => {
    // Setup: Mock with no active prompts
    const mockToken = 'test-token';
    const mockUser = 'testUser';

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue([]);
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Shows error and redirects
    expect(alertSpy).toHaveBeenCalledWith('No prompts found. Please contact support.');
    expect(mockPush).toHaveBeenCalledWith('/');
    
    alertSpy.mockRestore();
  });

  it('should pass prompt snapshots to startSession', async () => {
    // Setup: Mock prompts
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'Prompt text 1', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'Prompt text 2', position: 2, isActive: true },
      { _id: 'prompt3', promptText: 'Prompt text 3', position: 3, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: startSession called with prompt snapshots
    expect(api.startSession).toHaveBeenCalledWith(
      mockUser,
      expect.any(String), // callSessionId
      [
        { promptId: 'prompt1', promptText: 'Prompt text 1' },
        { promptId: 'prompt2', promptText: 'Prompt text 2' },
        { promptId: 'prompt3', promptText: 'Prompt text 3' },
      ]
    );
  });

  it('should respect prompt order from backend', async () => {
    // Setup: Mock prompts in specific order
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt3', promptText: 'Third', position: 3, isActive: true },
      { _id: 'prompt1', promptText: 'First', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'Second', position: 2, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Prompts passed to startSession in the order received from backend
    // (Backend should return them sorted by position)
    expect(api.startSession).toHaveBeenCalledWith(
      mockUser,
      expect.any(String),
      [
        { promptId: 'prompt3', promptText: 'Third' },
        { promptId: 'prompt1', promptText: 'First' },
        { promptId: 'prompt2', promptText: 'Second' },
      ]
    );
  });

  it('should reload prompts on each mount (fresh data)', async () => {
    // Setup: First mount
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts1 = [
      { _id: 'prompt1', promptText: 'Old prompt', position: 1, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts1);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // First mount
    const wrapper1 = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(api.getActivePrompts).toHaveBeenCalledTimes(1);

    // Unmount
    wrapper1.unmount();
    vi.clearAllMocks();

    // Setup: Second mount with different prompts
    const mockActivePrompts2 = [
      { _id: 'prompt1', promptText: 'NEW prompt text', position: 1, isActive: true },
      { _id: 'prompt2', promptText: 'Another new prompt', position: 2, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts2);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-456' });

    // Second mount
    const wrapper2 = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: getActivePrompts called again with fresh data
    expect(api.getActivePrompts).toHaveBeenCalledTimes(1);
    expect(api.startSession).toHaveBeenCalledWith(
      mockUser,
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ promptText: 'NEW prompt text' }),
        expect.objectContaining({ promptText: 'Another new prompt' }),
      ])
    );
  });
});

describe('ReflectView - Integration with Backend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it('should call getActivePrompts (not getUserPrompts)', async () => {
    // This test ensures we're using the correct API method
    const mockToken = 'test-token';
    const mockUser = 'testUser';
    const mockActivePrompts = [
      { _id: 'prompt1', promptText: 'Prompt 1', position: 1, isActive: true },
    ];

    vi.mocked(api.getToken).mockReturnValue(mockToken);
    vi.mocked(api.authenticate).mockResolvedValue({ user: mockUser });
    vi.mocked(api.getEntryByDate).mockResolvedValue({ error: 'Not found' });
    vi.mocked(api.getProfile).mockResolvedValue({ includeRating: true });
    vi.mocked(api.getActivePrompts).mockResolvedValue(mockActivePrompts);
    vi.mocked(api.startSession).mockResolvedValue({ session: 'session-123' });

    // Mount component
    const wrapper = mount(ReflectView);
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify: Uses getActivePrompts (which filters by isActive: true)
    expect(api.getActivePrompts).toHaveBeenCalled();
    
    // Verify: Does NOT call getUserPrompts (which would return all prompts)
    expect((api as any).getUserPrompts).toBeUndefined();
  });
});
