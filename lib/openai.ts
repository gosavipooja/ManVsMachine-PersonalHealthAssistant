import OpenAI from 'openai';
import { UserProfile, LogEntry, AICoachResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AICoachService {
  private static instance: AICoachService;
  
  static getInstance() {
    if (!AICoachService.instance) {
      AICoachService.instance = new AICoachService();
    }
    return AICoachService.instance;
  }

  async generateDailyMotivation(
    profile: UserProfile,
    todayLogs: LogEntry[],
    history: LogEntry[]
  ): Promise<string> {
    const prompt = this.buildMotivationPrompt(profile, todayLogs, history);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a personal health coach. Provide short, motivational, and personalized messages (2 sentences max).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Keep up the great work!';
    } catch (error) {
      console.error('Error generating motivation:', error);
      return 'You\'re doing amazing! Keep building those healthy habits!';
    }
  }

  async generateNutritionSuggestions(
    profile: UserProfile,
    foodLogs: LogEntry[]
  ): Promise<string[]> {
    const prompt = this.buildNutritionPrompt(profile, foodLogs);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist. Provide 1-2 practical, culturally-aware suggestions for improving nutrition.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content || '';
      return content.split('\n').filter(line => line.trim()).slice(0, 2);
    } catch (error) {
      console.error('Error generating nutrition suggestions:', error);
      return ['Try adding more vegetables to your next meal!'];
    }
  }

  async generateCoachingResponse(
    profile: UserProfile,
    logs: LogEntry[],
    userMessage: string
  ): Promise<string> {
    const prompt = this.buildChatPrompt(profile, logs, userMessage);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a personal health coach. Answer briefly, factually, and motivationally. Personalize based on user profile and logs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I\'m here to help you with your health journey!';
    } catch (error) {
      console.error('Error generating coaching response:', error);
      return 'I\'m here to support your health goals! How can I help you today?';
    }
  }

  async generateComprehensiveInsights(
    profile: UserProfile,
    logs: LogEntry[]
  ): Promise<AICoachResponse> {
    const prompt = this.buildInsightsPrompt(profile, logs);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a personal health coach. Provide comprehensive insights including motivation, suggestions, and next steps.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseCoachingResponse(content);
    } catch (error) {
      console.error('Error generating comprehensive insights:', error);
      return {
        motivationMessage: 'You\'re making great progress!',
        suggestions: ['Keep tracking your habits consistently'],
        insights: ['Consistency is key to building lasting habits'],
        progressSummary: 'You\'re on the right track!',
        nextSteps: ['Continue with your current routine']
      };
    }
  }

  private buildMotivationPrompt(profile: UserProfile, todayLogs: LogEntry[], history: LogEntry[]): string {
    const recentActivity = todayLogs.map(log => 
      `${log.habitId}: ${log.value} ${log.unit}${log.notes ? ` (${log.notes})` : ''}`
    ).join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Today's Activity: ${recentActivity || 'No activity logged yet'}
Recent History: ${history.slice(-5).map(log => `${log.habitId}: ${log.value}`).join(', ')}

Write a personalized motivational message (2 sentences max) based on their progress and profile.
    `.trim();
  }

  private buildNutritionPrompt(profile: UserProfile, foodLogs: LogEntry[]): string {
    const recentFood = foodLogs.slice(-3).map(log => 
      log.metadata?.foodItems?.join(', ') || log.notes || 'Unknown food'
    ).join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Recent Food Intake: ${recentFood}

Suggest 1-2 practical nutrition improvements considering their body type and cultural background.
    `.trim();
  }

  private buildChatPrompt(profile: UserProfile, logs: LogEntry[], userMessage: string): string {
    const recentLogs = logs.slice(-5).map(log => 
      `${log.habitId}: ${log.value} ${log.unit}`
    ).join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Recent Activity: ${recentLogs}
User Question: ${userMessage}

Provide a helpful, personalized response as their health coach.
    `.trim();
  }

  private buildInsightsPrompt(profile: UserProfile, logs: LogEntry[]): string {
    const weeklyLogs = logs.slice(-7);
    const habitSummary = weeklyLogs.reduce((acc, log) => {
      acc[log.habitId] = (acc[log.habitId] || 0) + log.value;
      return acc;
    }, {} as Record<string, number>);

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Weekly Activity Summary: ${Object.entries(habitSummary).map(([habit, value]) => `${habit}: ${value}`).join(', ')}

Provide comprehensive insights including:
1. Motivational message
2. 2-3 practical suggestions
3. Key insights about their progress
4. Progress summary
5. Next steps for improvement
    `.trim();
  }

  private parseCoachingResponse(content: string): AICoachResponse {
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      motivationMessage: lines[0] || 'Keep up the great work!',
      suggestions: lines.slice(1, 4).filter(line => line.includes('•') || line.includes('-')),
      insights: lines.slice(4, 7).filter(line => line.includes('insight') || line.includes('pattern')),
      progressSummary: lines.find(line => line.includes('progress') || line.includes('summary')) || 'You\'re making steady progress!',
      nextSteps: lines.slice(-3).filter(line => line.includes('next') || line.includes('try') || line.includes('consider'))
    };
  }
}

export const aiCoach = AICoachService.getInstance();
