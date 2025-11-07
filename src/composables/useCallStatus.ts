import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/services/api';

export function useCallStatus() {
  const activeCall = ref<any>(null);
  const isCallInQueue = ref(false); // PENDING status
  const isCallInProgress = ref(false); // IN_PROGRESS status
  const isCallCompleted = ref(false);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const checkCallStatus = async () => {
    try {
      // Check for scheduled call FIRST (PENDING or IN_PROGRESS in CallScheduler)
      // This needs to be checked before session to catch the PENDING state
      try {
        const scheduledCalls = await api.getActiveCallsForUser();
        console.log('[CallStatus] Scheduled calls:', scheduledCalls);
        
        if (scheduledCalls && Array.isArray(scheduledCalls) && scheduledCalls.length > 0) {
          const pendingCall = scheduledCalls.find((call: any) => call.status === 'PENDING');
          const inProgressCall = scheduledCalls.find((call: any) => call.status === 'IN_PROGRESS');
          
          if (pendingCall) {
            // Call is queued, waiting for pregeneration
            console.log('[CallStatus] Found PENDING call');
            activeCall.value = pendingCall;
            isCallInQueue.value = true;
            isCallInProgress.value = false;
            isCallCompleted.value = false;
            return;
          } else if (inProgressCall) {
            // Call is being initiated
            console.log('[CallStatus] Found IN_PROGRESS scheduled call');
            activeCall.value = inProgressCall;
            isCallInQueue.value = false;
            isCallInProgress.value = true;
            isCallCompleted.value = false;
            return;
          }
        }
      } catch (error) {
        console.log('[CallStatus] No scheduled calls found or error checking:', error);
      }
      
      // Check for active reflection session (IN_PROGRESS status)
      const result = await api.getActiveSession();
      const sessionArray = (result as any) || [];
      
      // Backend returns array format: [{ session: ReflectionSessionDoc | null }]
      const sessionData = sessionArray[0]?.session;
      
      if (sessionData && sessionData.status === 'IN_PROGRESS') {
        console.log('[CallStatus] Found IN_PROGRESS session');
        activeCall.value = sessionData;
        isCallInQueue.value = false;
        isCallInProgress.value = true;
        isCallCompleted.value = false;
        return;
      }
      
      // No active session or scheduled call, check if there's a completed entry for today
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
        isCallInQueue.value = false;
        isCallInProgress.value = false;
        isCallCompleted.value = true;
      } else {
        // No entry for today - no call
        activeCall.value = null;
        isCallInQueue.value = false;
        isCallInProgress.value = false;
        isCallCompleted.value = false;
      }
    } catch (error) {
      console.error('Failed to check call status:', error);
      // On error, assume no call in progress to allow user to retry
      activeCall.value = null;
      isCallInQueue.value = false;
      isCallInProgress.value = false;
      isCallCompleted.value = false;
    }
  };

  const startPolling = (intervalMs: number = 2000, onCallComplete?: () => void) => {
    // Store the completion callback
    let wasInProgress = false;
    
    const checkWithCallback = async () => {
      const hadActiveCall = isCallInProgress.value || isCallInQueue.value;
      await checkCallStatus();
      
      // Detect transition from active to no active call (completion)
      if (hadActiveCall && !isCallInProgress.value && !isCallInQueue.value && onCallComplete) {
        console.log('[CallStatus] Call completed, triggering callback');
        onCallComplete();
      }
    };
    
    // Check immediately
    checkWithCallback();
    
    // Then poll at interval (default 2s to catch PENDING state quickly)
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(checkWithCallback, intervalMs);
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
    isCallInQueue,
    isCallInProgress,
    isCallCompleted,
    checkCallStatus,
    startPolling,
    stopPolling,
  };
}
