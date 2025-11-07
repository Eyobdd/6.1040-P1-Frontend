<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-section">
        <img src="@/assets/ZienNameLogo.svg" alt="Zien" class="logo" />
        <p class="tagline">Focus, so you can see what matters.</p>
      </div>

      <div class="auth-form">
        <h2>{{ formTitle }}</h2>
        
        <div v-if="!codeSent" class="form-step">
          <label for="phone">Phone Number</label>
          <div class="phone-input-group">
            <v-select
              v-model="countryCode"
              :items="countryCodes"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              class="country-code-select"
            ></v-select>
            <v-text-field
              id="phone"
              v-model="phoneNumberLocal"
              type="tel"
              placeholder="2025551234"
              variant="outlined"
              density="comfortable"
              hide-details
              class="phone-input"
              @keyup.enter="requestCode"
            ></v-text-field>
          </div>
          
          <button @click="requestCode" class="primary-button" :disabled="loading">
            {{ loading ? 'Sending...' : 'Continue' }}
          </button>
          
          <p class="hint">Enter your phone number (country code will be added automatically)</p>
        </div>

        <div v-else-if="!showProfileForm" class="form-step">
          <label for="code">Verification Code</label>
          <input
            id="code"
            v-model="verificationCode"
            type="text"
            placeholder="123456"
            maxlength="6"
            class="input-field"
            @keyup.enter="verify"
          />
          
          <button @click="verify" class="primary-button" :disabled="loading">
            {{ loading ? 'Verifying...' : 'Continue' }}
          </button>
          
          <button @click="resetForm" class="secondary-button">
            Change Number
          </button>
          
          <p class="hint">Check the backend console for the verification code (SMS mocked for demo)</p>
        </div>

        <div v-else class="form-step">
          <label for="name">First Name <span class="required">*</span></label>
          <input
            id="name"
            v-model="displayName"
            type="text"
            placeholder="John"
            class="input-field"
            required
            @keyup.enter="completeSignup"
          />
          
          <label for="pronunciation">Name Pronunciation (Optional)</label>
          <input
            id="pronunciation"
            v-model="namePronunciation"
            type="text"
            placeholder="JON DOH"
            class="input-field"
            @keyup.enter="completeSignup"
          />
          <p class="hint">How should we pronounce your name during calls? (e.g., "JON DOH" for "John Doe")</p>
          
          <button @click="completeSignup" class="primary-button" :disabled="loading || !displayName.trim()">
            {{ loading ? 'Creating Account...' : 'Complete Setup' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="statusMessage" class="status-message">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';

const router = useRouter();

const countryCode = ref('+1'); // Default to US
const phoneNumberLocal = ref('');
const verificationCode = ref('');
const codeSent = ref(false);
const loading = ref(false);
const error = ref('');
const statusMessage = ref('');
const isNewUser = ref(false);
const showProfileForm = ref(false);
const displayName = ref('');
const namePronunciation = ref('');

// Country code options
const countryCodes = [
  { label: '🇺🇸 +1', value: '+1' },
  { label: '🇬🇧 +44', value: '+44' },
  { label: '🇮🇳 +91', value: '+91' },
  { label: '🇨🇳 +86', value: '+86' },
  { label: '🇯🇵 +81', value: '+81' },
  { label: '🇩🇪 +49', value: '+49' },
  { label: '🇫🇷 +33', value: '+33' },
  { label: '🇦🇺 +61', value: '+61' },
  { label: '🇧🇷 +55', value: '+55' },
  { label: '🇲🇽 +52', value: '+52' },
];

// Computed full phone number
const phoneNumber = computed(() => {
  return countryCode.value + phoneNumberLocal.value;
});

const formTitle = computed(() => {
  if (!codeSent.value) return 'Welcome';
  return isNewUser.value ? 'Create Your Account' : 'Welcome Back';
});

async function requestCode() {
  error.value = '';
  statusMessage.value = '';
  loading.value = true;

  try {
    // Check if user exists
    const userCheck = await api.post<string | null>('UserAuthentication/_getUserByPhone', {
      phoneNumber: phoneNumber.value,
    });

    // Backend returns user ID directly (string) or null
    isNewUser.value = !userCheck;
    
    if (isNewUser.value) {
      statusMessage.value = 'New phone number detected. We\'ll create your account.';
    } else {
      statusMessage.value = 'Welcome back! Sending verification code...';
    }

    // Request verification code
    const result = await api.requestVerificationCode(phoneNumber.value);
    
    if (result && typeof result === 'object' && 'error' in result) {
      error.value = String(result.error);
    } else {
      codeSent.value = true;
      console.log('✅ Verification code sent! Check the backend console for the code.');
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to send code';
  } finally {
    loading.value = false;
  }
}

async function verify() {
  error.value = '';
  statusMessage.value = '';
  loading.value = true;

  try {
    if (isNewUser.value) {
      // For new users, verify code then show profile form
      await verifyCodeForSignup();
    } else {
      // Login flow
      await handleLogin();
    }
  } catch (e: any) {
    error.value = e.message || 'Authentication failed';
  } finally {
    loading.value = false;
  }
}

async function verifyCodeForSignup() {
  // Just verify the code is valid, don't create account yet
  const verifyResult = await api.post<{ valid?: boolean; error?: string }>('UserAuthentication/verifyCode', {
    phoneNumber: phoneNumber.value,
    code: verificationCode.value,
  });

  if ('error' in verifyResult || !verifyResult.valid) {
    error.value = verifyResult.error || 'Invalid verification code';
    return;
  }

  // Code is valid, show profile form
  showProfileForm.value = true;
}

async function completeSignup() {
  error.value = '';
  statusMessage.value = '';
  loading.value = true;

  try {
    await handleSignup();
  } catch (e: any) {
    error.value = e.message || 'Failed to create account';
  } finally {
    loading.value = false;
  }
}

async function handleSignup() {
  // Create the user
  const userResult = await api.post<{ user?: string; error?: string }>('User/createUser', {});
  
  if ('error' in userResult || !userResult.user) {
    error.value = userResult.error || 'Failed to create user';
    return;
  }

  const userId = userResult.user;

  // Create verified credentials (returns token directly)
  const result = await api.post<{ token?: string; error?: string }>('UserAuthentication/createVerifiedCredentials', {
    user: userId,
    phoneNumber: phoneNumber.value,
    code: verificationCode.value,
  });

  if ('error' in result) {
    error.value = result.error!;
    return;
  }

  // Detect user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log('Detected timezone:', userTimezone);

  // Set token first so authenticated requests work
  if (result.token) {
    api.setToken(result.token);
  }

  // Create profile with detected timezone and user info
  await api.createProfile(
    displayName.value,
    phoneNumber.value,
    userTimezone,
    namePronunciation.value || undefined
  );

  // Create default prompts
  await api.createDefaultPrompts();

  // Set token and redirect
  if (result.token) {
    api.setToken(result.token);
    localStorage.setItem('phoneNumber', phoneNumber.value);
    router.push('/');
  }
}

async function handleLogin() {
  const result = await api.login(phoneNumber.value, verificationCode.value);

  if ('error' in result) {
    error.value = result.error!;
  } else if ('token' in result && result.token) {
    api.setToken(result.token);
    localStorage.setItem('phoneNumber', phoneNumber.value);
    router.push('/');
  }
}

function resetForm() {
  phoneNumberLocal.value = '';
  verificationCode.value = '';
  codeSent.value = false;
  showProfileForm.value = false;
  displayName.value = '';
  namePronunciation.value = '';
  error.value = '';
  statusMessage.value = '';
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  padding: 40px;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  height: 48px;
  margin-bottom: 8px;
}

.tagline {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.auth-form h2 {
  margin: 0 0 24px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.form-step {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

label .required {
  color: #e74c3c;
  margin-left: 2px;
}

.phone-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.country-code-select {
  width: auto;
  min-width: 100px;
  max-width: 120px;
  flex-shrink: 0;
}

.phone-input {
  flex: 1;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #20808d;
}

.primary-button {
  width: 100%;
  padding: 12px;
  background: #20808d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 8px;
}

.primary-button:hover:not(:disabled) {
  background: #1a6b76;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  width: 100%;
  padding: 12px;
  background: white;
  color: #20808d;
  border: 1px solid #20808d;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.secondary-button:hover {
  background: #f0f9fa;
}

.hint {
  font-size: 12px;
  color: #666;
  margin: 8px 0 0 0;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin: 16px 0;
  font-size: 14px;
}

.status-message {
  background: #e8f5f7;
  color: #20808d;
  padding: 12px;
  border-radius: 6px;
  margin: 16px 0;
  font-size: 14px;
}
</style>
