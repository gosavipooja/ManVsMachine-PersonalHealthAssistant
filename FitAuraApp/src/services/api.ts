import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

export interface InsightsResponse {
  success: boolean;
  data: {
    summary: string;
    motivation: string;
    suggestions: string[];
    keyInsights: string[];
    progressSummary: string;
    nextSteps: string[];
    dinnerRecommendation?: string;
    similarUsers: any[];
    relevantRecommendations: any[];
    userPatterns: any;
    similarPatterns: any[];
  };
  metadata: {
    userId: string;
    analysisTimeframe: string;
    generatedAt: string;
    personalizationFactors: any;
    dataPoints: any;
    userContext: any;
    foodContext?: any;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    userId: string;
    name: string;
    age: number;
    gender: string;
    weight: number;
    height: number;
    bodyType: string;
    goals: string[];
    activity_level: string;
    culture: string;
  };
}

export interface LogResponse {
  success: boolean;
  data: any[];
}

class ApiService {
  private axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get AI Insights
  async getInsights(
    userId: string, 
    days: number = 1, 
    includeRecommendations: boolean = true
  ): Promise<InsightsResponse> {
    const response = await this.axiosInstance.get(API_ENDPOINTS.INSIGHTS, {
      params: {
        userId,
        days,
        includeRecommendations: includeRecommendations.toString()
      }
    });
    return response.data;
  }

  // Get User Profile
  async getProfile(userId: string): Promise<ProfileResponse> {
    const response = await this.axiosInstance.get(`${API_ENDPOINTS.PROFILE}/${userId}`);
    return response.data;
  }

  // Update User Profile
  async updateProfile(userId: string, profileData: any): Promise<any> {
    const response = await this.axiosInstance.put(`${API_ENDPOINTS.PROFILE}/${userId}`, profileData);
    return response.data;
  }

  // Get User Logs
  async getLogs(userId: string, limit?: number): Promise<LogResponse> {
    const response = await this.axiosInstance.get(`${API_ENDPOINTS.LOGGING}/${userId}`, {
      params: limit ? { limit } : {}
    });
    return response.data;
  }

  // Create New Log
  async createLog(logData: any): Promise<any> {
    const response = await this.axiosInstance.post(API_ENDPOINTS.LOGGING, logData);
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await this.axiosInstance.get(API_ENDPOINTS.HEALTH);
    return response.data;
  }
}

export const apiService = new ApiService();
