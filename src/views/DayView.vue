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
          <div class="empty-card" :class="{ 'call-in-progress': isCallInProgress && isToday }">
            <v-icon v-if="isCallInProgress && isToday" size="64" color="#20808d">mdi-phone-in-talk</v-icon>
            <v-icon v-else-if="isPastDay" size="64" color="#999">mdi-calendar-remove</v-icon>
            <v-icon v-else-if="isFutureDay" size="64" color="#ccc">mdi-calendar-clock</v-icon>
            <v-icon v-else size="64" color="#ccc">mdi-book-open-outline</v-icon>
            <h2 v-if="isCallInProgress && isToday">Call In Progress</h2>
            <h2 v-else-if="isPastDay">No reflection recorded today</h2>
            <h2 v-else-if="isFutureDay">Future date</h2>
            <h2 v-else-if="canStartReflection">No reflection yet for today</h2>
            <h2 v-else>No reflection for this day</h2>
            <p v-if="isCallInProgress && isToday" class="call-message">Your reflection call is currently in progress. Please complete the call to see your responses here.</p>
            <p v-else-if="isPastDay" class="disabled-message">You missed recording a reflection for this day</p>
            <p v-else-if="isFutureDay" class="disabled-message">Reflections can only be recorded for today or past days</p>
            <p v-else-if="canStartReflection">Take a few minutes to reflect on your day</p>
            <p v-else class="disabled-message">Reflections can only be recorded for today</p>
            <div v-if="canStartReflection && !isCallInProgress" class="reflection-actions">
              <v-btn 
                @click="startReflection" 
                color="#20808d" 
                size="large" 
                class="mt-4"
                :disabled="isCallInProgress"
                aria-label="Start reflection for today"
              >
                <v-icon left>mdi-pencil</v-icon>
                Type Reflection
              </v-btn>
              <v-btn 
                @click="initiatePhoneCall" 
                color="#20808d" 
                size="large" 
                class="mt-4 ml-3"
                :disabled="isCallInProgress"
                :loading="checkingCallStatus"
                aria-label="Initiate phone reflection"
              >
                <v-icon left>mdi-phone</v-icon>
                Initiate Call
              </v-btn>
            </div>
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
import { useCallStatus } from '@/composables/useCallStatus';
import { useAlert } from '@/composables/useAlert';

const router = useRouter();
const loading = ref(true);
const selectedDate = ref(new Date());
const dayEntry = ref<any>(null);
const responses = ref<any[]>([]);
const currentUser = ref<string | null>(null);
const showModal = ref(false);
const selectedResponse = ref<any>(null);
const selectedResponseIndex = ref(0);
const checkingCallStatus = ref(false);

// Call status tracking
const { isCallInProgress } = useCallStatus();
const { showAlert } = useAlert();

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

const isPastDay = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate.value);
  selected.setHours(0, 0, 0, 0);
  return selected.getTime() < today.getTime();
});

const isFutureDay = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate.value);
  selected.setHours(0, 0, 0, 0);
  return selected.getTime() > today.getTime();
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
    // NOTE: Backend now uses user's timezone from profile to extract dates
    // So we send the local date string directly (YYYY-MM-DD in user's timezone)
    const year = selectedDate.value.getFullYear();
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.value.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const entryResult = await api.getEntryByDate(dateString);
    console.log('Entry result:', entryResult);
    console.log('Date string:', dateString);

    // Backend returns [{ entry: JournalEntryDoc | null }] (array wrapper for Engine pattern)
    const resultArray = entryResult as any;
    const entry = Array.isArray(resultArray) && resultArray[0]?.entry
      ? resultArray[0].entry
      : (resultArray?.entry || null);
    console.log('Parsed entry:', entry);

    if (entry && '_id' in entry) {
      dayEntry.value = entry;
      // Load responses
      const responsesResult = await api.getEntryResponses(entry._id);
      
      // Backend returns [{ responses: [...] }] (array wrapper for Engine pattern)
      const responsesResultArray = responsesResult as any;
      const responsesArray = Array.isArray(responsesResultArray) && responsesResultArray[0]?.responses
        ? responsesResultArray[0].responses
        : (responsesResultArray?.responses || []);
      
      if (Array.isArray(responsesArray)) {
        responses.value = responsesArray;
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

async function initiatePhoneCall() {
  if (!currentUser.value) return;
  
  // Check if call is already in progress
  if (isCallInProgress.value) {
    await showAlert({ message: 'Unable to start a new call. There is currently a reflection session in progress.' });
    return;
  }
  
  checkingCallStatus.value = true;
  try {
    // Get phone number from authenticated user
    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      await showAlert({ message: 'Unable to retrieve your phone number. Please log in again.' });
      return;
    }
    
    // Create reflection session
    const callSession = `call:${Date.now()}`;
    const prompts = [
      { promptId: 'prompt1', promptText: 'What are you grateful for today?' },
      { promptId: 'prompt2', promptText: 'What is one thing you learned today?' }
    ];
    
    const sessionResult = await api.startSession(callSession, prompts, 'PHONE');
    if ('error' in sessionResult) {
      await showAlert({ message: 'Unable to start your reflection session. Please try again.' });
      return;
    }
    
    // Schedule call for right now
    const scheduledFor = new Date();
    const callResult = await api.scheduleCall(callSession, phoneNumber, scheduledFor);
    
    if ('error' in callResult) {
      await showAlert({ message: 'Unable to schedule your call. Please try again.' });
      return;
    }
    
    await showAlert({ message: 'Call scheduled! Your phone will ring shortly.' });
  } catch (error) {
    console.error('Failed to initiate call:', error);
    await showAlert({ message: 'Unable to start your call. Please try again.' });
  } finally {
    checkingCallStatus.value = false;
  }
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

.reflection-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.disabled-message {
  color: #999 !important;
  font-style: italic;
}

.call-message {
  color: #20808d !important;
  font-weight: 500;
}

.empty-card.call-in-progress {
  border-color: #20808d;
  background: rgba(32, 128, 141, 0.02);
}

.empty-card.call-in-progress h2 {
  color: #20808d;
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
