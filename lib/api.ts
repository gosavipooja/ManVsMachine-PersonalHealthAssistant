import axios from 'axios';
import { UserProfile, LogEntry, CoachingRequest, CoachingResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class AICoachingAPI {
  // Main coaching endpoint
  static async getCoachingInsights(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      const response = await api.post('/ai/coaching', request);
      return response.data.data;
    } catch (error) {
      console.error('Error getting coaching insights:', error);
      throw new Error('Failed to get coaching insights');
    }
  }

  // Quick motivation
  static async getMotivation(
    profile: UserProfile, 
    todayLogs: LogEntry[], 
    history: LogEntry[] = [],
    context: any = {}
  ): Promise<string> {
    try {
      const response = await api.post('/ai/motivation', {
        profile,
        todayLogs,
        history,
        context
      });
      return response.data.data.motivation_message;
    } catch (error) {
      console.error('Error getting motivation:', error);
      return 'You\'re doing great! Keep building those healthy habits!';
    }
  }

  // Nutrition suggestions
  static async getNutritionSuggestions(
    profile: UserProfile, 
    foodLogs: LogEntry[], 
    context: any = {}
  ): Promise<string[]> {
    try {
      const response = await api.post('/ai/nutrition', {
        profile,
        foodLogs,
        context
      });
      return response.data.data.suggestions;
    } catch (error) {
      console.error('Error getting nutrition suggestions:', error);
      return ['Try adding more vegetables to your next meal!'];
    }
  }

  // Chat with AI coach
  static async chatWithCoach(
    profile: UserProfile, 
    message: string, 
    logs: LogEntry[] = [],
    context: any = {}
  ): Promise<string> {
    try {
      const response = await api.post('/ai/chat', {
        profile,
        message,
        logs,
        context
      });
      return response.data.data.aiResponse.content;
    } catch (error) {
      console.error('Error chatting with coach:', error);
      return 'I\'m here to help you with your health journey!';
    }
  }

  // Cultural insights
  static async getCulturalInsights(
    profile: UserProfile, 
    logs: LogEntry[] = []
  ): Promise<string[]> {
    try {
      const response = await api.post('/ai/cultural-insights', {
        profile,
        logs
      });
      return response.data.data.cultural_notes;
    } catch (error) {
      console.error('Error getting cultural insights:', error);
      return [];
    }
  }

  // Health tips
  static async getHealthTips(
    profile: UserProfile, 
    logs: LogEntry[] = [],
    context: any = {}
  ): Promise<string[]> {
    try {
      const response = await api.post('/ai/health-tips', {
        profile,
        logs,
        context
      });
      return response.data.data.health_tips;
    } catch (error) {
      console.error('Error getting health tips:', error);
      return [];
    }
  }

  // Get coaching history
  static async getCoachingHistory(
    userId: string, 
    limit: number = 20, 
    type: 'all' | 'coaching' | 'chat' = 'all'
  ): Promise<any[]> {
    try {
      const response = await api.get(`/ai/history/${userId}`, {
        params: { limit, type }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting coaching history:', error);
      return [];
    }
  }

  // Test prompt (for development)
  static async testPrompt(
    promptType: string, 
    profile: UserProfile, 
    logs: LogEntry[] = [],
    context: any = {}
  ): Promise<any> {
    try {
      const response = await api.post('/ai/test-prompt', {
        promptType,
        profile,
        logs,
        context
      });
      return response.data.data;
    } catch (error) {
      console.error('Error testing prompt:', error);
      throw new Error('Failed to test prompt');
    }
  }
}

// Profile API
export class ProfileAPI {
  static async createProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const response = await api.post('/profile', profile);
      return response.data.data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create profile');
    }
  }

  static async getProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await api.get(`/profile/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error('Failed to get profile');
    }
  }

  static async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.put(`/profile/${userId}`, profile);
      return response.data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }
}

// Logging API
export class LoggingAPI {
  static async logActivity(logEntry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    try {
      const response = await api.post('/logging', logEntry);
      return response.data.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw new Error('Failed to log activity');
    }
  }

  static async uploadPhoto(
    file: File, 
    habitId: string, 
    userId: string
  ): Promise<LogEntry> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('habitId', habitId);
      formData.append('userId', userId);

      const response = await api.post('/logging/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  }

  static async getLogs(userId: string, limit: number = 50): Promise<LogEntry[]> {
    try {
      const response = await api.get(`/logging/${userId}`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  static async getTodayLogs(userId: string): Promise<LogEntry[]> {
    try {
      const response = await api.get(`/logging/${userId}/today`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting today\'s logs:', error);
      return [];
    }
  }
}

// Dashboard API
export class DashboardAPI {
  static async getDashboardData(userId: string): Promise<any> {
    try {
      const response = await api.get(`/dashboard/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  static async getHabitProgress(userId: string, habitId: string, days: number = 7): Promise<any> {
    try {
      const response = await api.get(`/dashboard/${userId}/habit/${habitId}`, {
        params: { days }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting habit progress:', error);
      throw new Error('Failed to get habit progress');
    }
  }
}

export default api;
