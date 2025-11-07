<template>
  <div class="reflect-container">
    <v-tooltip text="Abandon this reflection session" location="bottom">
      <template v-slot:activator="{ props }">
        <button 
          @click="abandonReflection" 
          class="abandon-button"
          v-bind="props"
        >
          Abandon Reflection
        </button>
      </template>
    </v-tooltip>
    <div class="reflect-card">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <div v-if="!completed" class="prompt-section">
        <p class="step-indicator">{{ currentStep + 1 }} of {{ totalSteps }}</p>
        <h2 class="prompt-text">{{ currentPrompt?.promptText }}</h2>
        
        <textarea
          v-if="!isRatingPrompt"
          v-model="currentResponse"
          class="response-input"
          :placeholder="'Share your thoughts...'"
          rows="6"
          autofocus
        ></textarea>

        <div v-else class="rating-section">
          <p class="rating-label">Rate your response</p>
          <div class="rating-buttons">
            <button
              v-for="rating in [-2, -1, 0, 1, 2]"
              :key="rating"
              @click="selectRating(rating)"
              :class="['rating-btn', { selected: selectedRating === rating }]"
            >
              {{ getRatingEmoji(rating) }}
              <span class="rating-number">{{ rating }}</span>
            </button>
          </div>
        </div>

        <div class="button-group">
          <button
            v-if="currentStep > 0"
            @click="previousStep"
            class="secondary-button"
          >
            Back
          </button>
          <button
            @click="nextStep"
            :disabled="!canProceed"
            class="primary-button"
          >
            {{ currentStep === totalSteps - 1 ? 'Complete' : 'Next' }}
          </button>
        </div>
      </div>

      <div v-else class="completion-section">
        <div class="success-icon">✓</div>
        <h2>Reflection Complete!</h2>
        <p>Your thoughts have been saved.</p>
        <button @click="goToDashboard" class="primary-button">
          View Today's Entry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { api } from '@/services/api';
import { useAlert } from '@/composables/useAlert';

const router = useRouter();
const { showAlert } = useAlert();

const prompts = ref<any[]>([]);
const responses = ref<string[]>([]);
const currentStep = ref(0);
const currentResponse = ref('');
const selectedRating = ref<number | null>(null);
const sessionId = ref<string | null>(null);
const currentUser = ref<string | null>(null);
const completed = ref(false);
const loading = ref(true);
const existingEntry = ref<any>(null);
const showExistingEntry = ref(false);
const includeRating = ref(false);

const totalSteps = computed(() => prompts.value.length);
const progress = computed(() => ((currentStep.value + 1) / totalSteps.value) * 100);
const currentPrompt = computed(() => prompts.value[currentStep.value]);
const isRatingPrompt = computed(() => currentPrompt.value?.isRatingPrompt === true);

const canProceed = computed(() => {
  if (isRatingPrompt.value) {
    // Rating prompt - require rating selection
    return selectedRating.value !== null;
  } else {
    // Regular prompt - require text response
    return currentResponse.value.trim().length > 0;
  }
});

function getRatingEmoji(rating: number) {
  const emojis = ['😢', '😕', '😐', '🙂', '😊'];
  return emojis[rating + 2];
}

async function loadPromptsAndStartSession() {
  try {
    // Get current user
    const token = api.getToken();
    if (!token) {
      router.push('/auth');
      return;
    }

    const authResult = await api.authenticate(token);
    if ('error' in authResult || !authResult.user) {
      router.push('/auth');
      return;
    }

    currentUser.value = authResult.user;

    // Check if there's already a completed entry for today
    // NOTE: Backend now uses user's timezone from profile to extract dates
    // So we send the local date string directly (YYYY-MM-DD in user's timezone)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const entryResult = await api.getEntryByDate(today);
    
    if (entryResult && typeof entryResult === 'object' && '_id' in entryResult) {
      // Entry exists for today - redirect to day view
      router.push('/');
      return;
    }

    // Note: Session recovery disabled due to Engine timeout issues with _getActiveSession query
    // If there's an existing IN_PROGRESS session, the backend will return an error with the session ID
    // and we'll handle it in the error handler below

    // Get active prompts (only active ones from user's current settings, including rating prompts if active)
    const promptsResult = await api.getActivePrompts();
    
    // Backend returns { prompts: [...] }
    const promptsArray = (promptsResult as any)?.prompts || promptsResult;
    
    if (Array.isArray(promptsArray) && promptsArray.length > 0) {
      // Sort prompts: regular prompts first (by position), then rating prompts (by position)
      const sortedPrompts = promptsArray.sort((a: any, b: any) => {
        // If one is rating and other isn't, non-rating comes first
        if (a.isRatingPrompt && !b.isRatingPrompt) return 1;
        if (!a.isRatingPrompt && b.isRatingPrompt) return -1;
        // Otherwise sort by position
        return a.position - b.position;
      });
      
      prompts.value = sortedPrompts;
      responses.value = new Array(sortedPrompts.length).fill('');
    } else {
      await showAlert({ message: 'Please set up your reflection prompts before starting a session.' });
      router.push('/journal/prompts');
      return;
    }

    // Start reflection session
    const callSessionId = `call:${Date.now()}`;
    const sessionResult = await api.startSession(
      callSessionId,
      prompts.value.map((p: any) => ({
        promptId: p._id,
        promptText: p.promptText,
      }))
    );

    if ('error' in sessionResult) {
      // Check if error is about existing IN_PROGRESS session
      const errorMsg = sessionResult.error || '';
      const sessionIdMatch = errorMsg.match(/IN_PROGRESS session: ([a-f0-9-]+)/);
      
      if (sessionIdMatch) {
        // Found existing session ID in error message
        const existingSessionId = sessionIdMatch[1];
        
        const abandon = await showAlert({
          message: 'You have an incomplete reflection from before. Would you like to abandon it and start fresh?',
          showCancel: true,
          confirmText: 'Start Fresh',
          cancelText: 'Cancel',
        });
        
        if (abandon) {
          if (existingSessionId) {
            await api.abandonSession(existingSessionId);
          }
          // Retry starting the session
          await loadPromptsAndStartSession();
          return;
        } else {
          router.push('/');
          return;
        }
      }
      
      // Other error - show generic message
      await showAlert({ message: 'Unable to start your reflection session. Please try again.' });
      router.push('/');
      return;
    }

    if (!sessionResult.session) {
      await showAlert({ message: 'Unable to start your reflection session. Please try again.' });
      router.push('/');
      return;
    }

    sessionId.value = sessionResult.session;
    loading.value = false;
  } catch (e) {
    await showAlert({ message: 'Unable to start your reflection session. Please try again.' });
    router.push('/');
  }
}

async function nextStep() {
  if (!canProceed.value) return;

  // Save current response
  const responseText = isRatingPrompt.value 
    ? String(selectedRating.value) 
    : currentResponse.value;
  
  responses.value[currentStep.value] = responseText;
  
  // Record response to backend
  await api.recordResponse(
    sessionId.value!,
    prompts.value[currentStep.value]._id,
    prompts.value[currentStep.value].promptText,
    currentStep.value + 1,
    responseText
  );

  // Reset inputs
  currentResponse.value = '';
  selectedRating.value = null;
  currentStep.value++;
  
  // If we've finished all prompts, complete the reflection
  if (currentStep.value >= prompts.value.length) {
    await completeReflection();
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
    const previousResponse = responses.value[currentStep.value];
    
    // Restore the previous response based on prompt type
    if (prompts.value[currentStep.value]?.isRatingPrompt) {
      selectedRating.value = previousResponse ? Number(previousResponse) : null;
      currentResponse.value = '';
    } else {
      currentResponse.value = previousResponse || '';
      selectedRating.value = null;
    }
  }
}

function selectRating(rating: number) {
  selectedRating.value = rating;
}

async function completeReflection() {
  try {
    // Check if any prompt was a rating prompt
    const hasRatingPrompt = prompts.value.some(p => p.isRatingPrompt);
    const ratingValue = hasRatingPrompt ? responses.value.find((r, i) => prompts.value[i]?.isRatingPrompt) : null;
    
    // Set rating if we have one
    if (hasRatingPrompt && ratingValue !== null && ratingValue !== undefined) {
      await api.setRating(sessionId.value!, Number(ratingValue));
    }

    // Complete session
    await api.completeSession(sessionId.value!, prompts.value.length);

    // Get session data
    const session = await api.getSession(sessionId.value!);
    const sessionResponsesResult = await api.getSessionResponses(sessionId.value!);
    
    // Backend returns { responses: [...] }, extract the array
    const sessionResponses = (sessionResponsesResult as any)?.responses || sessionResponsesResult;

    // Create journal entry
    await api.createFromSession(
      {
        user: currentUser.value,
        reflectionSession: sessionId.value,
        endedAt: new Date().toISOString(),
        rating: hasRatingPrompt && ratingValue ? Number(ratingValue) : undefined,
      },
      sessionResponses
    );

    completed.value = true;
  } catch (e) {
    await showAlert({ message: 'Unable to save your reflection. Please try again.' });
  }
}

function goToDashboard() {
  router.push('/');
}

async function abandonReflection() {
  const confirmed = await showAlert({
    message: 'Are you sure you want to abandon this reflection? Your progress will be lost.',
    showCancel: true,
    confirmText: 'Abandon',
    cancelText: 'Continue',
  });
  
  if (confirmed) {
    await cleanupIncompleteSession();
    router.push('/');
  }
}

async function resumeSession(session: any) {
  sessionId.value = session._id;
  prompts.value = session.prompts;
  
  // Load existing responses
  const responsesResult = await api.getSessionResponses(session._id);
  const existingResponses = (responsesResult as any)?.responses || [];
  
  // Reconstruct state
  responses.value = new Array(prompts.value.length).fill('');
  existingResponses.forEach((r: any) => {
    responses.value[r.position - 1] = r.responseText;
  });
  
  // Load user's rating preference
  const profile = await api.getProfile();
  if (profile && typeof profile === 'object' && 'includeRating' in profile) {
    includeRating.value = !!(profile as { includeRating: boolean }).includeRating;
  }
  
  // Resume at first unanswered prompt or rating step
  currentStep.value = existingResponses.length;
  
  // If we're at the rating step and rating was already set, load it
  if (currentStep.value >= prompts.value.length && session.rating !== undefined) {
    selectedRating.value = session.rating;
  }
  
  loading.value = false;
}

async function cleanupIncompleteSession() {
  // Simplified: Backend handles idempotency, no need for cleanupInProgress flag
  if (sessionId.value && !completed.value) {
    try {
      await api.abandonSession(sessionId.value);
    } catch (e) {
      // Safe to ignore - backend will handle via webhook if this was a phone call
    }
  }
}

onMounted(() => {
  loadPromptsAndStartSession();
});

// Cleanup when navigating away from this route
onBeforeRouteLeave(async (to, from) => {
  await cleanupIncompleteSession();
  return true;
});
</script>

<style scoped>
.reflect-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.abandon-button {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 20px;
  background: transparent;
  color: #666;
  border: 1px solid #d0d0d0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  white-space: nowrap;
  outline: none;
}

.abandon-button:focus {
  outline: none;
}

.abandon-button:focus-visible {
  outline: 2px solid #e53e3e;
  outline-offset: 2px;
}

.abandon-button:hover {
  background: #fef2f2;
  border-color: #e53e3e;
  color: #e53e3e;
}

.reflect-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  overflow: hidden;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
}

.progress-fill {
  height: 100%;
  background: #20808d;
  transition: width 0.3s ease;
}

.prompt-section,
.completion-section {
  padding: 40px;
}

.step-indicator {
  color: #666;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.prompt-text {
  font-size: 24px;
  color: #333;
  margin: 0 0 24px 0;
  font-weight: 600;
}

.response-input {
  width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 24px;
  box-sizing: border-box;
}

.response-input:focus {
  outline: none;
  border-color: #20808d;
}

.rating-section {
  margin-bottom: 24px;
}

.rating-label {
  font-size: 18px;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.rating-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 32px;
  transition: all 0.2s;
}

.rating-btn:hover {
  border-color: #20808d;
  transform: scale(1.05);
}

.rating-btn.selected {
  border-color: #20808d;
  background: #f0f9fa;
}

.rating-number {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.button-group {
  display: flex;
  gap: 12px;
}

.primary-button,
.secondary-button {
  flex: 1;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.primary-button {
  background: #20808d;
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: #1a6b76;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-button {
  background: white;
  color: #20808d;
  border: 1px solid #20808d;
}

.secondary-button:hover {
  background: #f0f9fa;
}

.completion-section {
  text-align: center;
  padding: 60px 40px;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #20808d;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 24px;
}

.completion-section h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 12px 0;
}

.completion-section p {
  color: #666;
  margin: 0 0 32px 0;
  font-size: 16px;
}
</style>
