import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<string | null>(null);
  const isAuthenticated = computed(() => !!currentUser.value);

  async function initialize() {
    const token = api.getToken();
    if (token) {
      const result = await api.authenticate(token);
      if ('user' in result && result.user) {
        currentUser.value = result.user;
        return true;
      } else {
        api.clearToken();
        return false;
      }
    }
    return false;
  }

  async function login(phoneNumber: string, code: string) {
    const result = await api.login(phoneNumber, code);
    
    if ('error' in result) {
      throw new Error(String(result.error));
    }

    if (result.token) {
      api.setToken(result.token);
      const authResult = await api.authenticate(result.token);
      if ('user' in authResult && authResult.user) {
        currentUser.value = authResult.user;
        return true;
      }
    }
    
    return false;
  }

  async function register(phoneNumber: string, code: string, displayName: string) {
    // This is a simplified version - in reality, register doesn't return a token
    // We'd need to login after registration
    const result = await api.register(phoneNumber, code);
    
    if ('error' in result) {
      throw new Error(String(result.error));
    }

    // After registration, login
    return await login(phoneNumber, code);
  }

  function logout() {
    currentUser.value = null;
    api.clearToken();
  }

  return {
    currentUser,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
  };
});
