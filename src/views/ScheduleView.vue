<template>
  <div class="schedule-view">
    <!-- Hero Card -->
    <div class="hero-card">
      <div class="hero-icon">
        <v-icon size="48" color="#20808d">mdi-calendar-clock</v-icon>
      </div>
      <h1 class="hero-title">Weekly Schedule</h1>
      <p class="hero-subtitle">Set your default call windows for each day of the week</p>
    </div>

    <!-- Scheduler Component -->
    <div class="scheduler-container">
      <RecurringWeekScheduler v-if="userId" :userId="userId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RecurringWeekScheduler from '@/components/RecurringWeekScheduler.vue';
import { api } from '@/services/api';

const router = useRouter();
const userId = ref<string | null>(null);

onMounted(async () => {
  try {
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

    userId.value = authResult.user;
  } catch (e) {
    console.error('Failed to load schedule:', e);
    router.push('/auth');
  }
});
</script>

<style scoped>
.schedule-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fcfcf9;
}

/* Hero Card */
.hero-card {
  background: #fcfcf9;
  padding: 48px 40px;
  text-align: center;
  flex-shrink: 0;
}

.hero-icon {
  margin-bottom: 16px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #202020;
  margin: 0 0 8px 0;
  font-family: Georgia, serif;
}

.hero-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

.scheduler-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
