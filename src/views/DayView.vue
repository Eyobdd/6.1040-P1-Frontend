<template>
  <div class="day-view-page">
    <!-- Date Carousel Header -->
    <DateCarousel v-model:selectedDate="selectedDate" />

    <div class="page-container">
      <!-- Main Content Feed -->
      <div class="main-content">
        <!-- Hero Card -->
        <div class="hero-card">
          <div class="hero-icon">
            <v-icon size="48" color="#20808d">mdi-calendar-today</v-icon>
          </div>
          <h1 class="hero-title">Day View</h1>
          <p class="hero-subtitle">{{ formattedDate }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate color="#20808d"></v-progress-circular>
          <p>Loading your day...</p>
        </div>

        <!-- No Entry State -->
        <div v-else-if="!dayEntry" class="no-entry-state">
          <div class="empty-card">
            <v-icon size="64" color="#ccc">mdi-book-open-outline</v-icon>
            <h2 v-if="canStartReflection">No reflection yet for today</h2>
            <h2 v-else>No reflection for this day</h2>
            <p v-if="canStartReflection">Take a few minutes to reflect on your day</p>
            <p v-else class="disabled-message">Reflections can only be recorded for today</p>
            <v-btn 
              v-if="canStartReflection"
              @click="startReflection" 
              color="#20808d" 
              size="large" 
              class="mt-4"
              aria-label="Start reflection for today"
            >
              Start Reflection
            </v-btn>
          </div>
        </div>

        <!-- Journal Response Cards Grid -->
        <div v-else class="responses-grid">
          <JournalResponseCard
            v-for="(response, index) in responses"
            :key="response._id"
            :prompt="response.promptText"
            :response="response.responseText"
            :colorIndex="index"
            @click="openResponseModal(response, index)"
          />
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="right-sidebar">
        <DayScoreWidget :score="dayEntry?.rating" />
        <CallWindowsCard 
          v-if="currentUser"
          :selectedDate="selectedDate" 
          :userId="currentUser"
          class="call-windows-section"
        />
      </div>
    </div>

    <!-- Response Modal -->
    <ResponseModal
      v-model="showModal"
      :prompt="selectedResponse?.promptText || ''"
      :response="selectedResponse?.responseText || ''"
      :colorIndex="selectedResponseIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import DateCarousel from '@/components/DateCarousel.vue';
import JournalResponseCard from '@/components/JournalResponseCard.vue';
import DayScoreWidget from '@/components/DayScoreWidget.vue';
import ResponseModal from '@/components/ResponseModal.vue';
import CallWindowsCard from '@/components/CallWindowsCard.vue';

const router = useRouter();
const loading = ref(true);
const selectedDate = ref(new Date());
const dayEntry = ref<any>(null);
const responses = ref<any[]>([]);
const currentUser = ref<string | null>(null);
const showModal = ref(false);
const selectedResponse = ref<any>(null);
const selectedResponseIndex = ref(0);

const formattedDate = computed(() => {
  return selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const isToday = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate.value);
  selected.setHours(0, 0, 0, 0);
  return selected.getTime() === today.getTime();
});

const canStartReflection = computed(() => {
  // Only allow reflection for today
  return isToday.value;
});

function openResponseModal(response: any, index: number) {
  selectedResponse.value = response;
  selectedResponseIndex.value = index;
  showModal.value = true;
}

async function loadEntryForDate() {
  loading.value = true;
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

    // Get entry for selected date
    const dateString = selectedDate.value.toISOString().split('T')[0];
    const entryResult = await api.getEntryByDate(authResult.user, dateString);

    if (entryResult && '_id' in entryResult) {
      dayEntry.value = entryResult;
      // Load responses
      const responsesResult = await api.getEntryResponses(entryResult._id);
      if (Array.isArray(responsesResult)) {
        responses.value = responsesResult;
      }
    } else {
      dayEntry.value = null;
      responses.value = [];
    }
  } catch (e) {
    console.error('Failed to load entry:', e);
  } finally {
    loading.value = false;
  }
}

// Watch for date changes
watch(selectedDate, () => {
  loadEntryForDate();
});

function startReflection() {
  router.push('/reflect');
}

onMounted(() => {
  loadEntryForDate();
});
</script>

<style scoped>
.day-view-page {
  background: #fcfcf9;
  min-height: 100vh;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
}

/* Main Content Feed */
.main-content {
  min-width: 0;
}

/* Hero Card */
.hero-card {
  background: #fcfcf9;
  padding: 48px 40px;
  margin-bottom: 32px;
  text-align: center;
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

/* Loading State */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.loading-state p {
  margin-top: 16px;
  font-size: 16px;
}

/* No Entry State */
.no-entry-state {
  margin-top: 40px;
}

.empty-card {
  background: #fcfcf9;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
}

.empty-card h2 {
  font-size: 24px;
  color: #333;
  margin: 16px 0 8px 0;
}

.empty-card p {
  color: #666;
  margin: 0 0 24px 0;
  font-size: 16px;
}

.disabled-message {
  color: #999 !important;
  font-style: italic;
}

/* Journal Response Cards Grid */
.responses-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Right Sidebar */
.right-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.call-windows-section {
  flex: 1;
  min-height: 600px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .page-container {
    grid-template-columns: 1fr 280px;
    gap: 24px;
  }
  
  .responses-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 968px) {
  .page-container {
    grid-template-columns: 1fr;
  }
  
  .right-sidebar {
    order: -1;
  }
  
  .responses-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .responses-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .page-container {
    padding: 20px 16px;
  }
}
</style>
