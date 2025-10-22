<template>
  <div class="reflect-container">
    <div class="reflect-card">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <div v-if="!completed" class="prompt-section">
        <p class="step-indicator">{{ currentStep + 1 }} of {{ totalSteps }}</p>
        <h2 class="prompt-text">{{ currentPrompt?.promptText }}</h2>
        
        <textarea
          v-if="currentStep < prompts.length"
          v-model="currentResponse"
          class="response-input"
          :placeholder="'Share your thoughts...'"
          rows="6"
          autofocus
        ></textarea>

        <div v-else class="rating-section">
          <p class="rating-label">How was your day?</p>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const router = useRouter();

const prompts = ref<any[]>([]);
const responses = ref<string[]>([]);
const currentStep = ref(0);
const currentResponse = ref('');
const selectedRating = ref<number | null>(null);
const sessionId = ref<string | null>(null);
const currentUser = ref<string | null>(null);
const completed = ref(false);
const loading = ref(true);

const totalSteps = computed(() => prompts.value.length + 1); // prompts + rating
const progress = computed(() => ((currentStep.value + 1) / totalSteps.value) * 100);
const currentPrompt = computed(() => prompts.value[currentStep.value]);

const canProceed = computed(() => {
  if (currentStep.value < prompts.value.length) {
    return currentResponse.value.trim().length > 0;
  } else {
    return selectedRating.value !== null;
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
      router.push('/login');
      return;
    }

    const authResult = await api.authenticate(token);
    if ('error' in authResult || !authResult.user) {
      router.push('/login');
      return;
    }

    currentUser.value = authResult.user;

    // Get active prompts
    const promptsResult = await api.getActivePrompts(authResult.user);
    if (Array.isArray(promptsResult) && promptsResult.length > 0) {
      prompts.value = promptsResult;
      responses.value = new Array(promptsResult.length).fill('');
    } else {
      alert('No prompts found. Please contact support.');
      router.push('/');
      return;
    }

    // Start reflection session
    const callSessionId = `call:${Date.now()}`;
    const sessionResult = await api.startSession(
      authResult.user,
      callSessionId,
      promptsResult.map((p: any) => ({
        promptId: p._id,
        promptText: p.promptText,
      }))
    );

    if ('error' in sessionResult) {
      alert(sessionResult.error);
      router.push('/');
      return;
    }

    sessionId.value = sessionResult.session!;
    loading.value = false;
  } catch (e) {
    console.error('Failed to start session:', e);
    alert('Failed to start reflection session');
    router.push('/');
  }
}

async function nextStep() {
  if (!canProceed.value) return;

  // Save current response
  if (currentStep.value < prompts.value.length) {
    responses.value[currentStep.value] = currentResponse.value;
    
    // Record response to backend
    await api.recordResponse(
      sessionId.value!,
      prompts.value[currentStep.value]._id,
      prompts.value[currentStep.value].promptText,
      currentStep.value + 1,
      currentResponse.value
    );

    currentResponse.value = '';
    currentStep.value++;
  } else {
    // Rating step - complete session
    await completeReflection();
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
    if (currentStep.value < prompts.value.length) {
      currentResponse.value = responses.value[currentStep.value];
    }
  }
}

function selectRating(rating: number) {
  selectedRating.value = rating;
}

async function completeReflection() {
  try {
    // Set rating
    await api.setRating(sessionId.value!, selectedRating.value!);

    // Complete session
    await api.completeSession(sessionId.value!, prompts.value.length);

    // Get session data
    const session = await api.getSession(sessionId.value!);
    const sessionResponses = await api.getSessionResponses(sessionId.value!);

    // Create journal entry
    await api.createFromSession(
      {
        user: currentUser.value,
        reflectionSession: sessionId.value,
        endedAt: new Date(),
        rating: selectedRating.value,
      },
      sessionResponses
    );

    completed.value = true;
  } catch (e) {
    console.error('Failed to complete reflection:', e);
    alert('Failed to save reflection');
  }
}

function goToDashboard() {
  router.push('/');
}

onMounted(() => {
  loadPromptsAndStartSession();
});
</script>

<style scoped>
.reflect-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
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
