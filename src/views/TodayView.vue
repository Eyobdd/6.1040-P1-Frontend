<template>
  <div class="dashboard">
    <div class="header">
      <h1>Today</h1>
      <p class="date">{{ todayDate }}</p>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">Loading...</div>

      <div v-else-if="todayEntry" class="journal-section">
        <h2>Today's Reflection</h2>
        <div class="entry-card">
          <div class="rating">
            <span class="rating-label">Day Rating:</span>
            <span class="rating-value">{{ getRatingEmoji(todayEntry.rating) }} {{ todayEntry.rating }}</span>
          </div>
          <div class="responses">
            <div v-for="response in responses" :key="response._id" class="response-item">
              <p class="prompt">{{ response.promptText }}</p>
              <p class="response">{{ response.responseText }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-entry">
        <h2>No reflection yet today</h2>
        <p>Take a few minutes to reflect on your day</p>
        <button @click="startReflection" class="start-button">
          Start Reflection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const router = useRouter();
const loading = ref(true);
const todayEntry = ref<any>(null);
const responses = ref<any[]>([]);
const currentUser = ref<string | null>(null);

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getRatingEmoji(rating: number) {
  const emojis = ['😢', '😕', '😐', '🙂', '😊'];
  return emojis[rating + 2];
}

async function loadTodayEntry() {
  loading.value = true;
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

    // Get today's entry
    const today = new Date().toISOString().split('T')[0];
    const entryResult = await api.getEntryByDate(authResult.user, today);

    if (entryResult && '_id' in entryResult) {
      todayEntry.value = entryResult;
      // Load responses
      const responsesResult = await api.getEntryResponses(entryResult._id);
      if (Array.isArray(responsesResult)) {
        responses.value = responsesResult;
      }
    }
  } catch (e) {
    console.error('Failed to load today entry:', e);
  } finally {
    loading.value = false;
  }
}

function startReflection() {
  router.push('/reflect');
}

onMounted(() => {
  loadTodayEntry();
});
</script>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
  color: #333;
}

.date {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 16px;
}

.content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.journal-section h2,
.no-entry h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

.entry-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 24px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.rating-label {
  font-weight: 600;
  color: #333;
}

.rating-value {
  font-size: 20px;
  color: #20808d;
}

.responses {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.response-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.response-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prompt {
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.response {
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.no-entry {
  text-align: center;
  padding: 40px 20px;
}

.no-entry p {
  color: #666;
  margin: 0 0 24px 0;
}

.start-button {
  background: #20808d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.start-button:hover {
  background: #1a6b76;
}
</style>
