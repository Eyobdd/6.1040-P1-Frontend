import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/services/api';

export function useCallStatus() {
  const activeCall = ref<any>(null);
  const isCallInProgress = ref(false);
  const isCallCompleted = ref(false);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const checkCallStatus = async () => {
    try {
      // Check for active reflection session (IN_PROGRESS status)
      const result = await api.getActiveSession();
      const sessionArray = (result as any) || [];
      
      // Backend returns array format: [{ session: ReflectionSessionDoc | null }]
      const sessionData = sessionArray[0]?.session;
      
      if (sessionData && sessionData.status === 'IN_PROGRESS') {
        activeCall.value = sessionData;
        isCallInProgress.value = true;
        isCallCompleted.value = false;
      } else {
        // No IN_PROGRESS session, check if there's a completed entry for today
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        const entryResult = await api.getEntryByDate(today);
        const entry = (entryResult as any)?.entry || null;
        
        if (entry && '_id' in entry) {
          // Entry exists for today - call is completed
          activeCall.value = null;
          isCallInProgress.value = false;
          isCallCompleted.value = true;
        } else {
          // No entry for today - no call
          activeCall.value = null;
          isCallInProgress.value = false;
          isCallCompleted.value = false;
        }
      }
    } catch (error) {
      console.error('Failed to check call status:', error);
      // On error, assume no call in progress to allow user to retry
      activeCall.value = null;
      isCallInProgress.value = false;
      isCallCompleted.value = false;
    }
  };

  const startPolling = (intervalMs: number = 5000) => {
    // Check immediately
    checkCallStatus();
    
    // Then poll at interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(checkCallStatus, intervalMs);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  onMounted(() => {
    startPolling();
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    activeCall,
    isCallInProgress,
    isCallCompleted,
    checkCallStatus,
    startPolling,
    stopPolling,
  };
}
