<template>
  <div class="settings-page">
    <!-- Hero Card -->
    <div class="hero-card">
      <div class="hero-icon">
        <v-icon size="48" color="#20808d">mdi-cog</v-icon>
      </div>
      <h1 class="hero-title">Settings</h1>
      <p class="hero-subtitle">Manage your account preferences and profile</p>
    </div>

    <div class="settings-container">
      <!-- Account Section -->
      <div class="settings-section">        
        <div class="settings-grid">
          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Full Name</div>
              <div class="setting-value">{{ profile?.displayName || 'Not set' }}</div>
            </div>
            <div class="setting-right">
              <button @click="editField('displayName')" class="edit-button">Change full name</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Name Pronunciation</div>
              <div class="setting-value">{{ profile?.namePronunciation || 'Not set' }}</div>
            </div>
            <div class="setting-right">
              <button @click="editField('namePronunciation')" class="edit-button">Change pronunciation</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Phone Number</div>
              <div class="setting-value">{{ profile?.phoneNumber || 'Not set' }}</div>
            </div>
            <div class="setting-right">
              <button @click="editField('phoneNumber')" class="edit-button">Change phone number</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Timezone</div>
              <div class="setting-value">{{ profile?.timezone || 'Not set' }}</div>
            </div>
            <div class="setting-right">
              <button @click="editField('timezone')" class="edit-button">Change timezone</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Max Retries</div>
              <div class="setting-value">{{ profile?.maxRetries || 4 }}</div>
            </div>
            <div class="setting-right">
              <button @click="editField('maxRetries')" class="edit-button">Change max retries</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-left">
              <div class="setting-label">Logout</div>
              <div class="setting-description">Sign out of your account</div>
            </div>
            <div class="setting-right">
              <button @click="handleLogout" class="logout-button">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <v-dialog v-model="showEditModal" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editModalTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editValue"
            :label="editModalLabel"
            :placeholder="editModalPlaceholder"
            variant="outlined"
            density="comfortable"
            autofocus
            @keyup.enter="saveEdit"
          ></v-text-field>
          <p v-if="currentEditField === 'namePronunciation'" class="hint-text">
            How should we pronounce your name during calls? (e.g., "JON DOH" for "John Doe")
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showEditModal = false">
            Cancel
          </v-btn>
          <v-btn color="#20808d" variant="flat" @click="saveEdit" :loading="saving">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alert Snackbar -->
    <v-snackbar v-model="showAlert" :color="alertColor" :timeout="3000">
      {{ alertMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const router = useRouter();

const profile = ref<any>(null);
const loading = ref(true);

// Edit modal state
const showEditModal = ref(false);
const currentEditField = ref<string>('');
const editValue = ref('');
const saving = ref(false);

// Alert state
const showAlert = ref(false);
const alertMessage = ref('');
const alertColor = ref('success');


const editModalTitle = computed(() => {
  const titles: Record<string, string> = {
    displayName: 'Change Full Name',
    namePronunciation: 'Change Name Pronunciation',
    phoneNumber: 'Change Phone Number',
    timezone: 'Change Timezone',
    maxRetries: 'Change Max Retries',
  };
  return titles[currentEditField.value] || 'Edit';
});

const editModalLabel = computed(() => {
  const labels: Record<string, string> = {
    displayName: 'Full Name',
    namePronunciation: 'Name Pronunciation',
    phoneNumber: 'Phone Number',
    timezone: 'Timezone',
    maxRetries: 'Max Retries',
  };
  return labels[currentEditField.value] || '';
});

const editModalPlaceholder = computed(() => {
  const placeholders: Record<string, string> = {
    displayName: 'Enter your full name',
    namePronunciation: 'Enter pronunciation guide',
    phoneNumber: 'Enter phone number (E.164 format)',
    timezone: 'Enter timezone (e.g., America/New_York)',
    maxRetries: 'Enter max retries (1-10)',
  };
  return placeholders[currentEditField.value] || '';
});

async function loadProfile() {
  loading.value = true;
  try {
    const token = api.getToken();
    if (!token) {
      router.push('/auth');
      return;
    }

    const result = await api.getProfile();
    const profileData = Array.isArray(result) && result[0]?.profile
      ? result[0].profile
      : (result as any)?.profile;

    if (profileData) {
      profile.value = profileData;
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
    showAlertMessage('Failed to load profile', 'error');
  } finally {
    loading.value = false;
  }
}

function editField(field: string) {
  currentEditField.value = field;
  editValue.value = (profile.value as any)?.[field] || '';
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editValue.value.trim()) {
    showAlertMessage('Value cannot be empty', 'error');
    return;
  }

  saving.value = true;
  try {
    const updates: any = {};
    updates[currentEditField.value] = editValue.value;

    const result = await api.updateProfile(updates);

    if ('error' in result) {
      showAlertMessage(result.error, 'error');
    } else {
      // Update local profile
      (profile.value as any)[currentEditField.value] = editValue.value;
      showEditModal.value = false;
      showAlertMessage('Profile updated successfully', 'success');
    }
  } catch (e: any) {
    console.error('Failed to update profile:', e);
    showAlertMessage(e.message || 'Failed to update profile', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleLogout() {
  try {
    await api.post('UserAuthentication/logout', {});
    api.clearToken();
    localStorage.removeItem('phoneNumber');
    router.push('/auth');
  } catch (error) {
    console.error('Logout failed:', error);
    api.clearToken();
    localStorage.removeItem('phoneNumber');
    router.push('/auth');
  }
}

function showAlertMessage(message: string, color: string = 'success') {
  alertMessage.value = message;
  alertColor.value = color;
  showAlert.value = true;
}

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #fcfcf9;
  display: flex;
  flex-direction: column;
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

.settings-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px 60px 20px;
  width: 100%;
}

.settings-section {
  margin-bottom: 60px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #202020;
  margin: 0 0 32px 0;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}


.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 24px 0;
  gap: 60px;
  border-bottom: 1px solid #e8e8e8;
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-left {
  text-align: left;
}

.setting-right {
  display: flex;
  justify-content: flex-end;
  text-align: right;
}

.setting-label {
  font-size: 14px;
  font-weight: 700;
  color: #202020;
  margin-bottom: 4px;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.setting-value {
  font-size: 14px;
  color: #888;
  margin-top: 0;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.setting-description {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.edit-button {
  padding: 7px 16px;
  background: transparent;
  color: #666;
  border: 1px solid #d8d8d8;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.edit-button:hover {
  background: #20808D14;
  border-color: #20808d;
}

.logout-button {
  padding: 7px 16px;
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #d32f2f;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.logout-button:hover {
  background: #ffcdd2;
  border-color: #c62828;
}

.hint-text {
  font-size: 13px;
  color: #666;
  margin: 8px 0 0 0;
}

router-link {
  text-decoration: none;
}
</style>
