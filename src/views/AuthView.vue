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
          <input
            id="phone"
            v-model="phoneNumber"
            type="tel"
            placeholder="+1234567890"
            class="input-field"
            @keyup.enter="requestCode"
          />
          
          <button @click="requestCode" class="primary-button" :disabled="loading">
            {{ loading ? 'Sending...' : 'Continue' }}
          </button>
          
          <p class="hint">Enter your phone number in E.164 format (e.g., +12025551234)</p>
        </div>

        <div v-else class="form-step">
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

const phoneNumber = ref('');
const verificationCode = ref('');
const codeSent = ref(false);
const loading = ref(false);
const error = ref('');
const statusMessage = ref('');
const isNewUser = ref(false);

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
    
    if ('error' in result) {
      error.value = result.error;
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
      // Signup flow
      await handleSignup();
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

  // Create profile
  await api.createProfile(
    userId,
    'User',
    phoneNumber.value,
    'America/New_York'
  );

  // Create default prompts
  await api.createDefaultPrompts(userId);

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
  codeSent.value = false;
  verificationCode.value = '';
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
  color: #333;
  font-weight: 500;
  font-size: 14px;
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
