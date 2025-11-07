<template>
  <div class="past-entries-page">
    <div class="page-header">
      <div class="hero-card">
        <div class="hero-icon">
          <v-icon size="48" color="#20808d">mdi-archive-outline</v-icon>
        </div>
        <h1 class="hero-title">Past Entries</h1>
        <p class="hero-subtitle">Review your daily reflections and track your journey</p>
      </div>
    </div>

    <div class="entries-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="#20808d"></v-progress-circular>
        <p>Loading entries...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="entries.length === 0" class="empty-state">
        <v-icon size="64" color="#ccc">mdi-book-open-outline</v-icon>
        <h2>No journal entries yet</h2>
        <p>Complete your first reflection call to create an entry</p>
      </div>

      <!-- Entries List -->
      <div v-else class="entries-list">
        <div
          v-for="entry in entries"
          :key="entry._id"
          class="entry-card"
          @click="viewEntry(entry)"
        >
          <div class="entry-header">
            <div class="entry-date">
              <v-icon size="20" color="#20808d">mdi-calendar</v-icon>
              <span>{{ formatDate(entry.creationDate) }}</span>
            </div>
            <div v-if="entry.rating !== undefined" class="entry-rating">
              <v-icon size="18" color="#20808d">mdi-star</v-icon>
              <span>{{ entry.rating }}</span>
            </div>
          </div>
          
          <div class="entry-preview">
            <div
              v-for="(response, index) in entry.responses.slice(0, 2)"
              :key="index"
              class="response-preview"
            >
              <div class="response-prompt">{{ response.promptText }}</div>
              <div class="response-text">{{ truncate(response.responseText, 100) }}</div>
            </div>
            <div v-if="entry.responses.length > 2" class="more-responses">
              +{{ entry.responses.length - 2 }} more responses
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Entry Detail Modal -->
    <div v-if="selectedEntry" class="modal-overlay" @click.self="selectedEntry = null">
      <div class="modal-content entry-detail">
        <div class="modal-header">
          <div>
            <h2>{{ formatDate(selectedEntry.creationDate) }}</h2>
            <div v-if="selectedEntry.rating !== undefined" class="detail-rating">
              <v-icon size="24" color="#20808d">mdi-star</v-icon>
              <span class="rating-value">{{ selectedEntry.rating }}</span>
              <span class="rating-description">(Scale: -2 to +2)</span>
            </div>
          </div>
          <button class="close-btn" @click="selectedEntry = null">
            <v-icon size="24">mdi-close</v-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div
            v-for="(response, index) in selectedEntry.responses"
            :key="index"
            class="response-detail"
          >
            <div class="response-number">{{ index + 1 }}</div>
            <div class="response-content">
              <div class="response-prompt-detail">{{ response.promptText }}</div>
              <div class="response-text-detail">{{ response.responseText }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import { useRouter } from 'vue-router';

interface Response {
  promptText: string;
  responseText: string;
  position: number;
}

interface Entry {
  _id: string;
  user: string;
  creationDate: string;
  reflectionSession: string;
  rating?: number;
  responses: Response[];
}

const router = useRouter();
const entries = ref<Entry[]>([]);
const loading = ref(true);
const selectedEntry = ref<Entry | null>(null);
const userId = ref<string | null>(null);

const loadEntries = async () => {
  loading.value = true;
  try {
    // Get authenticated user
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
    
    const result = await api.getEntriesWithResponsesByUser();
    
    // Backend returns [{ entries: [...] }] (array wrapper for Engine pattern)
    const resultArray = result as any;
    const entriesArray = Array.isArray(resultArray) && resultArray[0]?.entries
      ? resultArray[0].entries
      : (resultArray?.entries || []);
    
    // The new endpoint returns entries with responses included
    if (Array.isArray(entriesArray)) {
      entries.value = entriesArray;
    } else {
      entries.value = [];
    }
  } catch (error) {
    entries.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const viewEntry = (entry: Entry) => {
  selectedEntry.value = entry;
};

onMounted(() => {
  loadEntries();
});
</script>

<style scoped>
.past-entries-page {
  min-height: 100vh;
  background: #fcfcf9;
  padding: 2rem;
}

.page-header {
  max-width: 900px;
  margin: 0 auto 2rem;
}

.hero-card {
  text-align: center;
  padding: 2rem;
  margin-bottom: 2rem;
}

.hero-icon {
  margin-bottom: 1rem;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #202020;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  font-family: 'Georgia', serif;
}

.hero-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.entries-container {
  max-width: 900px;
  margin: 0 auto;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-state p,
.empty-state p {
  margin-top: 1rem;
  color: #666;
}

.empty-state h2 {
  margin: 1rem 0 0.5rem;
  color: #202020;
  font-size: 1.5rem;
  font-weight: 600;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-card {
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.entry-card:hover {
  border-color: #20808d;
  box-shadow: 0 4px 12px rgba(32, 128, 141, 0.1);
  transform: translateY(-2px);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.entry-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #202020;
}

.entry-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #20808d;
  background: rgba(32, 128, 141, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.entry-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-preview {
  text-align: left;
}

.response-prompt {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}

.response-text {
  font-size: 0.95rem;
  color: #202020;
  line-height: 1.5;
}

.more-responses {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  margin-top: 4px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content.entry-detail {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

.modal-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #202020;
  margin: 0 0 0.5rem 0;
}

.detail-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0.5rem;
}

.rating-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #20808d;
}

.rating-scale {
  font-size: 1.25rem;
  font-weight: 600;
  color: #666;
}

.rating-description {
  font-size: 0.9rem;
  color: #999;
  font-style: italic;
  margin-left: 4px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #202020;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.response-detail {
  display: flex;
  gap: 16px;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.response-detail:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.response-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #20808d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.response-content {
  flex: 1;
  min-width: 0;
}

.response-prompt-detail {
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.75rem;
  text-align: left;
}

.response-text-detail {
  font-size: 1rem;
  color: #202020;
  line-height: 1.6;
  text-align: left;
  white-space: pre-wrap;
}
</style>
