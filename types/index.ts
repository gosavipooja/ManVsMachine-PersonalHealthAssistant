// User Profile Types
export interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
  culture: string;
  goals: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Habit Types
export interface Habit {
  id: string;
  name: string;
  description: string;
  type: 'hydration' | 'nutrition' | 'exercise' | 'sleep' | 'mindfulness';
  target: number; // daily target
  unit: string; // glasses, calories, minutes, etc.
  isActive: boolean;
  createdAt: Date;
}

// Log Entry Types
export interface LogEntry {
  id: string;
  habitId: string;
  value: number;
  unit: string;
  notes?: string;
  method: 'text' | 'voice' | 'photo';
  timestamp: Date;
  metadata?: {
    foodItems?: string[];
    calories?: number;
    imageUrl?: string;
    voiceTranscript?: string;
  };
}

// AI Coaching Types
export interface AICoachResponse {
  motivationMessage: string;
  suggestions: string[];
  insights: string[];
  progressSummary: string;
  nextSteps: string[];
}

// Dashboard Types
export interface DashboardData {
  todayProgress: {
    habitId: string;
    habitName: string;
    current: number;
    target: number;
    percentage: number;
  }[];
  streaks: {
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
  }[];
  weeklyProgress: {
    date: string;
    habits: {
      habitId: string;
      completed: boolean;
      value: number;
    }[];
  }[];
  aiInsights: AICoachResponse;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Weaviate Types
export interface WeaviateDocument {
  id: string;
  content: string;
  metadata: {
    type: 'log' | 'profile' | 'coaching';
    habitId?: string;
    userId?: string;
    timestamp: string;
    [key: string]: any;
  };
  vector?: number[];
}

// Reminder Types
export interface Reminder {
  id: string;
  habitId: string;
  message: string;
  time: string; // HH:MM format
  isActive: boolean;
  days: number[]; // 0-6 (Sunday-Saturday)
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    habitId?: string;
    logEntryId?: string;
  };
}
