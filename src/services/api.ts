// API Service for Zien Backend
import axios, { type AxiosInstance } from 'axios';

const API_BASE = 'http://localhost:8000/api';

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
  async createProfile(user: string, displayName: string, phoneNumber: string, timezone: string) {
    return this.post('Profile/createProfile', { user, displayName, phoneNumber, timezone });
  }

  async getProfile(user: string) {
    return this.post('Profile/_getProfile', { user });
  }

  async updateRatingPreference(user: string, includeRating: boolean) {
    return this.post('Profile/updateRatingPreference', { user, includeRating });
  }

  // JournalPrompt endpoints
  async createDefaultPrompts(user: string) {
    return this.post('JournalPrompt/createDefaultPrompts', { user });
  }

  async getUserPrompts(user: string) {
    return this.post('JournalPrompt/_getUserPrompts', { user });
  }

  async getActivePrompts(user: string) {
    return this.post('JournalPrompt/_getActivePrompts', { user });
  }

  async updatePromptText(user: string, position: number, newText: string) {
    return this.post('JournalPrompt/updatePromptText', { user, position, newText });
  }

  async reorderPrompts(user: string, newOrder: string[]) {
    return this.post('JournalPrompt/reorderPrompts', { user, newOrder });
  }

  async togglePromptActive(user: string, position: number) {
    return this.post('JournalPrompt/togglePromptActive', { user, position });
  }

  async deletePrompt(user: string, position: number) {
    return this.post('JournalPrompt/deletePrompt', { user, position });
  }

  async addPrompt(user: string, promptText: string) {
    return this.post<{ prompt?: string; error?: string }>('JournalPrompt/addPrompt', { user, promptText });
  }

  // ReflectionSession endpoints
  async startSession(user: string, callSession: string, prompts: Array<{ promptId: string; promptText: string }>) {
    return this.post<{ session?: string; error?: string }>('ReflectionSession/startSession', {
      user,
      callSession,
      prompts,
    });
  }

  async recordResponse(session: string, promptId: string, promptText: string, position: number, responseText: string) {
    return this.post('ReflectionSession/recordResponse', {
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
    return this.post('ReflectionSession/completeSession', { session, expectedPromptCount });
  }

  async getSessionResponses(session: string) {
    return this.post('ReflectionSession/_getSessionResponses', { session });
  }

  async getSession(session: string) {
    return this.post('ReflectionSession/_getSession', { session });
  }

  async abandonSession(session: string) {
    return this.post('ReflectionSession/abandonSession', { session });
  }

  // JournalEntry endpoints
  async createFromSession(sessionData: any, sessionResponses: any[]) {
    return this.post<{ entry?: string; error?: string }>('JournalEntry/createFromSession', {
      sessionData,
      sessionResponses,
    });
  }

  async getEntriesByUser(user: string) {
    return this.post('JournalEntry/_getEntriesByUser', { user });
  }

  async getEntriesWithResponsesByUser(user: string) {
    return this.post('JournalEntry/_getEntriesWithResponsesByUser', { user });
  }

  async getEntryByDate(user: string, date: string) {
    return this.post('JournalEntry/_getEntryByDate', { user, date });
  }

  async getEntryResponses(entry: string) {
    return this.post('JournalEntry/_getEntryResponses', { entry });
  }

  // CallWindow endpoints
  async createRecurringCallWindow(user: string, dayOfWeek: string, startTime: Date, endTime: Date) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/createRecurringCallWindow', {
      user,
      dayOfWeek,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }

  async createOneOffCallWindow(user: string, specificDate: string, startTime: Date, endTime: Date) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/createOneOffCallWindow', {
      user,
      specificDate,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }

  async deleteRecurringCallWindow(user: string, dayOfWeek: string, startTime: Date) {
    return this.post('CallWindow/deleteRecurringCallWindow', {
      user,
      dayOfWeek,
      startTime: startTime.toISOString(),
    });
  }

  async deleteOneOffCallWindow(user: string, specificDate: string, startTime: Date) {
    return this.post('CallWindow/deleteOneOffCallWindow', {
      user,
      specificDate,
      startTime: startTime.toISOString(),
    });
  }

  async getUserCallWindows(user: string) {
    return this.post('CallWindow/_getUserCallWindows', { user });
  }

  async getUserRecurringWindows(user: string) {
    return this.post('CallWindow/_getUserRecurringWindows', { user });
  }

  async getUserOneOffWindows(user: string) {
    return this.post('CallWindow/_getUserOneOffWindows', { user });
  }

  async getRecurringWindowsByDay(dayOfWeek: string) {
    return this.post('CallWindow/_getRecurringWindowsByDay', { dayOfWeek });
  }

  async getOneOffWindowsByDate(specificDate: string) {
    return this.post('CallWindow/_getOneOffWindowsByDate', { specificDate });
  }

  async mergeOverlappingOneOffWindows(user: string, specificDate: string, startTime: Date, endTime: Date) {
    return this.post<{ callWindow?: string; error?: string }>('CallWindow/mergeOverlappingOneOffWindows', {
      user,
      specificDate,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }

  async setDayModeCustom(user: string, date: string) {
    return this.post<{ dayMode?: string; error?: string }>('CallWindow/setDayModeCustom', {
      user,
      date,
    });
  }

  async setDayModeRecurring(user: string, date: string) {
    return this.post<{ dayMode?: string; error?: string }>('CallWindow/setDayModeRecurring', {
      user,
      date,
    });
  }

  async shouldUseRecurring(user: string, date: string) {
    return this.post<boolean>('CallWindow/shouldUseRecurring', {
      user,
      date,
    });
  }
}

export const api = new ApiService();
