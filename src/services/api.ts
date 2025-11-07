// API Service for Zien Backend
import axios, { type AxiosInstance } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    
    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  async post<T>(endpoint: string, data: any = {}): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(`/${endpoint}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // UserAuthentication endpoints
  async requestVerificationCode(phoneNumber: string) {
    return this.post('UserAuthentication/requestVerificationCode', { phoneNumber });
  }

  async register(phoneNumber: string, code: string) {
    // Need to create user first
    const userResult = await this.post<{ user?: string }>('User/createUser', {});
    
    if ('error' in userResult) {
      return userResult;
    }

    const result = await this.post<{ user?: string; error?: string }>('UserAuthentication/register', {
      phoneNumber,
      code,
      createUser: async () => userResult.user,
    });

    return result;
  }

  async login(phoneNumber: string, code: string) {
    return this.post<{ token?: string; error?: string }>('UserAuthentication/login', {
      phoneNumber,
      code,
    });
  }

  async authenticate(token: string) {
    return this.post<{ user?: string; error?: string }>('UserAuthentication/authenticate', { token });
  }

  // Profile endpoints
  async createProfile(displayName: string, phoneNumber: string, timezone: string, namePronunciation?: string) {
    const payload: any = { token: this.token, displayName, phoneNumber, timezone };
    if (namePronunciation) {
      payload.namePronunciation = namePronunciation;
    }
    return this.post('Profile/createProfile', payload);
  }

  async getProfile() {
    return this.post('Profile/_getProfile', { token: this.token });
  }

  async updateProfile(updates: {
    displayName?: string;
    phoneNumber?: string;
    timezone?: string;
    namePronunciation?: string;
    includeRating?: boolean;
    maxRetries?: number;
  }) {
    return this.post('Profile/updateProfile', { token: this.token, updates });
  }

  async updateRatingPreference(includeRating: boolean) {
    return this.post('Profile/updateRatingPreference', { token: this.token, includeRating });
  }

  // JournalPrompt endpoints
  async createDefaultPrompts() {
    return this.post('JournalPrompt/createDefaultPrompts', { token: this.token });
  }

  async getUserPrompts() {
    return this.post('JournalPrompt/_getUserPrompts', { token: this.token });
  }

  async getActivePrompts() {
    return this.post('JournalPrompt/_getActivePrompts', { token: this.token });
  }

  async updatePromptText(position: number, newText: string) {
    return this.post('JournalPrompt/updatePromptText', { token: this.token, position, newText });
  }

  async reorderPrompts(newOrder: string[]) {
    return this.post('JournalPrompt/reorderPrompts', { token: this.token, newOrder });
  }

  async togglePromptActive(position: number, isRatingPrompt: boolean = false) {
    return this.post('JournalPrompt/togglePromptActive', { token: this.token, position, isRatingPrompt });
  }

  async deletePrompt(position: number) {
    return this.post('JournalPrompt/deletePrompt', { token: this.token, position });
  }

  async addPrompt(promptText: string) {
    return this.post<{ prompt?: string; error?: string }>('JournalPrompt/addPrompt', { token: this.token, promptText });
  }

  // ReflectionSession endpoints
  async startSession(callSession: string, prompts: Array<{ promptId: string; promptText: string }>, method: 'PHONE' | 'TEXT' = 'TEXT') {
    return this.post<{ session?: string; error?: string }>('ReflectionSession/startSession', {
      token: this.token,
      callSession,
      prompts,
      method,
    });
  }

  async recordResponse(session: string, promptId: string, promptText: string, position: number, responseText: string) {
    return this.post('ReflectionSession/recordResponse', {
      token: this.token,
      session,
      promptId,
      promptText,
      position,
      responseText,
    });
  }

  async setRating(session: string, rating: number) {
    return this.post('ReflectionSession/setRating', { session, rating });
  }

  async completeSession(session: string, expectedPromptCount: number) {
    return this.post('ReflectionSession/completeSession', { token: this.token, session, expectedPromptCount });
  }

  async getSessionResponses(session: string) {
    return this.post('ReflectionSession/_getSessionResponses', { token: this.token, session });
  }

  async getSession(session: string) {
    return this.post('ReflectionSession/_getSession', { token: this.token, session });
  }

  async abandonSession(session: string) {
    return this.post('ReflectionSession/abandonSession', { token: this.token, session });
  }

  async getActiveSession() {
    return this.post('ReflectionSession/_getActiveSession', { token: this.token });
  }

  async getSessionStatus(session: string) {
    return this.post('ReflectionSession/getSessionStatus', { token: this.token, session });
  }

  // CallScheduler endpoints
  async scheduleCall(callSession: string, phoneNumber: string, scheduledFor: Date, maxRetries: number = 3) {
    return this.post<{ scheduledCall?: string; error?: string }>('CallScheduler/scheduleCall', {
      token: this.token,
      callSession,
      phoneNumber,
      scheduledFor: scheduledFor.toISOString(),
      maxRetries,
    });
  }

  async getActiveCallsForUser() {
    return this.post('CallScheduler/_getActiveCallsForUser', { token: this.token });
  }

  async getScheduledCall(callSession: string) {
    return this.post('CallScheduler/_getScheduledCall', { token: this.token, callSession });
  }

  async cancelCall(callSession: string) {
    return this.post('CallScheduler/cancelCall', { token: this.token, callSession });
  }

  // JournalEntry endpoints
  async createFromSession(sessionData: any, sessionResponses: any[]) {
    return this.post<{ entry?: string; error?: string }>('JournalEntry/createFromSession', {
      token: this.token,
      sessionData,
      sessionResponses,
    });
  }

  async getEntriesByUser() {
    return this.post('JournalEntry/_getEntriesByUser', { token: this.token });
  }

  async getEntriesWithResponsesByUser() {
    return this.post('JournalEntry/_getEntriesWithResponsesByUser', { token: this.token });
  }

  async getEntryByDate(date: string) {
    return this.post('JournalEntry/_getEntryByDate', { token: this.token, date });
  }

  async getEntryResponses(entry: string) {
    return this.post('JournalEntry/_getEntryResponses', { token: this.token, entry });
  }

  // CallWindow endpoints
  async createRecurringCallWindow(dayOfWeek: string, startTime: Date, endTime: Date) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/createRecurringCallWindow', {
      token: this.token,
      dayOfWeek,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }

  async createOneOffCallWindow(specificDate: string, startTime: Date | string, endTime: Date | string) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/createOneOffCallWindow', {
      token: this.token,
      specificDate,
      startTime: typeof startTime === 'string' ? startTime : startTime.toISOString(),
      endTime: typeof endTime === 'string' ? endTime : endTime.toISOString(),
    });
  }

  async deleteRecurringCallWindow(dayOfWeek: string, startTime: Date) {
    return this.post('CallWindow/deleteRecurringCallWindow', {
      token: this.token,
      dayOfWeek,
      startTime: startTime.toISOString(),
    });
  }

  async deleteOneOffCallWindow(specificDate: string, startTime: Date | string) {
    return this.post('CallWindow/deleteOneOffCallWindow', {
      token: this.token,
      specificDate,
      startTime: typeof startTime === 'string' ? startTime : startTime.toISOString(),
    });
  }

  async getUserCallWindows() {
    return this.post('CallWindow/_getUserCallWindows', { token: this.token });
  }

  async getUserRecurringWindows() {
    return this.post('CallWindow/_getUserRecurringWindows', { token: this.token });
  }

  async getUserOneOffWindows() {
    return this.post('CallWindow/_getUserOneOffWindows', { token: this.token });
  }

  async getRecurringWindowsByDay(dayOfWeek: string) {
    return this.post('CallWindow/_getRecurringWindowsByDay', { token: this.token, dayOfWeek });
  }

  async getOneOffWindowsByDate(specificDate: string) {
    return this.post('CallWindow/_getOneOffWindowsByDate', { token: this.token, specificDate });
  }

  async mergeOverlappingOneOffWindows(specificDate: string, startTime: Date | string, endTime: Date | string) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/mergeOverlappingOneOffWindows', {
      token: this.token,
      specificDate,
      startTime: typeof startTime === 'string' ? startTime : startTime.toISOString(),
      endTime: typeof endTime === 'string' ? endTime : endTime.toISOString(),
    });
  }

  async setDayModeCustom(date: string) {
    return this.post<{ dayMode?: string; error?: string }>('CallWindow/setDayModeCustom', {
      token: this.token,
      date,
    });
  }

  async setDayModeRecurring(date: string) {
    return this.post<{ dayMode?: string; error?: string }>('CallWindow/setDayModeRecurring', {
      token: this.token,
      date,
    });
  }

  async shouldUseRecurring(date: string) {
    return this.post<boolean>('CallWindow/shouldUseRecurring', {
      token: this.token,
      date,
    });
  }
}

export const api = new ApiService();
