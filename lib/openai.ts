import OpenAI from 'openai';
import { UserProfile, LogEntry, AICoachResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced types for better API responses
export interface CoachingRequest {
  profile: UserProfile;
  todayLogs: LogEntry[];
  history?: LogEntry[];
  context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    weather?: string;
    mood?: string;
    goals?: string[];
  };
}

export interface CoachingResponse {
  motivation_message: string;
  suggestions: string[];
  insights?: string[];
  progress_summary?: string;
  next_steps?: string[];
  cultural_notes?: string[];
  health_tips?: string[];
}

export class AICoachService {
  private static instance: AICoachService;
  
  static getInstance() {
    if (!AICoachService.instance) {
      AICoachService.instance = new AICoachService();
    }
    return AICoachService.instance;
  }

  // Main API endpoint for frontend
  async getCoachingInsights(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      const { profile, todayLogs, history = [], context } = request;
      
      // Generate comprehensive insights
      const insights = await this.generateComprehensiveInsights(profile, [...todayLogs, ...history]);
      
      // Generate cultural and health-specific tips
      const culturalNotes = await this.generateCulturalInsights(profile, todayLogs);
      const healthTips = await this.generateHealthTips(profile, todayLogs, context);
      
      return {
        motivation_message: insights.motivationMessage,
        suggestions: insights.suggestions,
        insights: insights.insights,
        progress_summary: insights.progressSummary,
        next_steps: insights.nextSteps,
        cultural_notes: culturalNotes,
        health_tips: healthTips
      };
    } catch (error) {
      console.error('Error generating coaching insights:', error);
      return this.getFallbackResponse();
    }
  }

  // Enhanced daily motivation with cultural personalization
  async generateDailyMotivation(
    profile: UserProfile,
    todayLogs: LogEntry[],
    history: LogEntry[],
    context?: { timeOfDay?: string; mood?: string }
  ): Promise<string> {
    const prompt = this.buildEnhancedMotivationPrompt(profile, todayLogs, history, context);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4', // Upgraded to GPT-4 for better responses
        messages: [
          {
            role: 'system',
            content: this.getMotivationSystemPrompt(profile.culture, profile.bodyType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || this.getFallbackMotivation(profile);
    } catch (error) {
      console.error('Error generating motivation:', error);
      return this.getFallbackMotivation(profile);
    }
  }

  // Enhanced nutrition suggestions with cultural awareness
  async generateNutritionSuggestions(
    profile: UserProfile,
    foodLogs: LogEntry[],
    context?: { mealTime?: string; dietaryRestrictions?: string[] }
  ): Promise<string[]> {
    const prompt = this.buildEnhancedNutritionPrompt(profile, foodLogs, context);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getNutritionSystemPrompt(profile.culture, profile.bodyType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseNutritionSuggestions(content);
    } catch (error) {
      console.error('Error generating nutrition suggestions:', error);
      return this.getFallbackNutritionSuggestions(profile);
    }
  }

  // Enhanced chat with better context awareness
  async generateCoachingResponse(
    profile: UserProfile,
    logs: LogEntry[],
    userMessage: string,
    context?: { previousMessages?: string[] }
  ): Promise<string> {
    const prompt = this.buildEnhancedChatPrompt(profile, logs, userMessage, context);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getChatSystemPrompt(profile.culture, profile.bodyType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I\'m here to help you with your health journey!';
    } catch (error) {
      console.error('Error generating coaching response:', error);
      return 'I\'m here to support your health goals! How can I help you today?';
    }
  }

  // Enhanced comprehensive insights
  async generateComprehensiveInsights(
    profile: UserProfile,
    logs: LogEntry[]
  ): Promise<AICoachResponse> {
    const prompt = this.buildEnhancedInsightsPrompt(profile, logs);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getInsightsSystemPrompt(profile.culture, profile.bodyType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseEnhancedCoachingResponse(content);
    } catch (error) {
      console.error('Error generating comprehensive insights:', error);
      return this.getFallbackInsights();
    }
  }

  // New: Cultural insights
  async generateCulturalInsights(profile: UserProfile, logs: LogEntry[]): Promise<string[]> {
    const prompt = this.buildCulturalPrompt(profile, logs);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a culturally-aware health coach specializing in ${profile.culture} wellness traditions. Provide 2-3 culturally relevant health tips.`
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
      return content.split('\n').filter(line => line.trim()).slice(0, 3);
    } catch (error) {
      console.error('Error generating cultural insights:', error);
      return [];
    }
  }

  // New: Health tips based on body type and goals
  async generateHealthTips(
    profile: UserProfile, 
    logs: LogEntry[], 
    context?: { timeOfDay?: string; weather?: string }
  ): Promise<string[]> {
    const prompt = this.buildHealthTipsPrompt(profile, logs, context);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a health expert specializing in ${profile.bodyType} body types. Provide 2-3 practical health tips.`
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
      return content.split('\n').filter(line => line.trim()).slice(0, 3);
    } catch (error) {
      console.error('Error generating health tips:', error);
      return [];
    }
  }

  // Enhanced prompt builders with cultural and contextual awareness
  private buildEnhancedMotivationPrompt(
    profile: UserProfile, 
    todayLogs: LogEntry[], 
    history: LogEntry[], 
    context?: { timeOfDay?: string; mood?: string }
  ): string {
    const recentActivity = todayLogs.map(log => 
      `${log.habitId}: ${log.value} ${log.unit}${log.notes ? ` (${log.notes})` : ''}`
    ).join(', ');

    const progressAnalysis = this.analyzeProgress(todayLogs, history);
    const timeContext = context?.timeOfDay ? `Time: ${context.timeOfDay}` : '';
    const moodContext = context?.mood ? `Mood: ${context.mood}` : '';

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Today's Activity: ${recentActivity || 'No activity logged yet'}
Progress Analysis: ${progressAnalysis}
${timeContext}
${moodContext}

Write a personalized, culturally-aware motivational message (2 sentences max) that:
- Acknowledges their cultural background and body type
- Celebrates their progress or encourages improvement
- Uses appropriate cultural references and tone
- Feels authentic and supportive
    `.trim();
  }

  private buildEnhancedNutritionPrompt(
    profile: UserProfile, 
    foodLogs: LogEntry[], 
    context?: { mealTime?: string; dietaryRestrictions?: string[] }
  ): string {
    const recentFood = foodLogs.slice(-3).map(log => 
      log.metadata?.foodItems?.join(', ') || log.notes || 'Unknown food'
    ).join(', ');

    const mealContext = context?.mealTime ? `Meal Time: ${context.mealTime}` : '';
    const restrictions = context?.dietaryRestrictions?.length ? 
      `Dietary Restrictions: ${context.dietaryRestrictions.join(', ')}` : '';

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Recent Food Intake: ${recentFood}
${mealContext}
${restrictions}

Suggest 2-3 practical nutrition improvements that:
- Consider their ${profile.bodyType} body type and metabolic needs
- Respect their ${profile.culture} cultural food preferences
- Are practical and achievable
- Include specific food recommendations
    `.trim();
  }

  private buildEnhancedChatPrompt(
    profile: UserProfile, 
    logs: LogEntry[], 
    userMessage: string, 
    context?: { previousMessages?: string[] }
  ): string {
    const recentLogs = logs.slice(-5).map(log => 
      `${log.habitId}: ${log.value} ${log.unit}`
    ).join(', ');

    const conversationContext = context?.previousMessages?.length ? 
      `Previous conversation: ${context.previousMessages.slice(-2).join(' | ')}` : '';

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Recent Activity: ${recentLogs}
${conversationContext}
User Question: ${userMessage}

Provide a helpful, personalized response as their health coach that:
- Acknowledges their cultural background and body type
- References their recent activity and goals
- Provides practical, actionable advice
- Maintains a supportive, encouraging tone
    `.trim();
  }

  private buildEnhancedInsightsPrompt(profile: UserProfile, logs: LogEntry[]): string {
    const weeklyLogs = logs.slice(-7);
    const habitSummary = weeklyLogs.reduce((acc, log) => {
      acc[log.habitId] = (acc[log.habitId] || 0) + log.value;
      return acc;
    }, {} as Record<string, number>);

    const progressTrends = this.analyzeProgressTrends(logs);
    const culturalContext = this.getCulturalContext(profile.culture);

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Weekly Activity Summary: ${Object.entries(habitSummary).map(([habit, value]) => `${habit}: ${value}`).join(', ')}
Progress Trends: ${progressTrends}
Cultural Context: ${culturalContext}

Provide comprehensive insights including:
1. Motivational message (culturally appropriate)
2. 2-3 practical suggestions (body type specific)
3. Key insights about their progress patterns
4. Progress summary with cultural context
5. Next steps for improvement (achievable goals)
    `.trim();
  }

  private buildCulturalPrompt(profile: UserProfile, logs: LogEntry[]): string {
    const recentActivity = logs.slice(-3).map(log => log.habitId).join(', ');
    
    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Recent Activity: ${recentActivity}

Provide 2-3 culturally relevant health tips that:
- Draw from ${profile.culture} wellness traditions
- Are practical and modern
- Respect cultural values and practices
- Complement their current activity
    `.trim();
  }

  private buildHealthTipsPrompt(
    profile: UserProfile, 
    logs: LogEntry[], 
    context?: { timeOfDay?: string; weather?: string }
  ): string {
    const recentActivity = logs.slice(-3).map(log => log.habitId).join(', ');
    const timeContext = context?.timeOfDay ? `Time: ${context.timeOfDay}` : '';
    const weatherContext = context?.weather ? `Weather: ${context.weather}` : '';

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type
Goals: ${profile.goals.join(', ')}
Recent Activity: ${recentActivity}
${timeContext}
${weatherContext}

Provide 2-3 practical health tips that:
- Are specific to ${profile.bodyType} body type
- Consider their current activity level
- Are appropriate for their goals
- Include specific recommendations
    `.trim();
  }

  // System prompts for different cultural contexts
  private getMotivationSystemPrompt(culture: string, bodyType: string): string {
    const culturalContexts = {
      'Indian': 'You understand Indian wellness traditions, Ayurveda principles, and cultural values around health and family.',
      'Chinese': 'You understand Traditional Chinese Medicine, cultural emphasis on balance, and family health values.',
      'Mexican': 'You understand Mexican wellness traditions, family-centered health practices, and cultural food values.',
      'American': 'You understand Western wellness approaches, individual health goals, and modern lifestyle challenges.',
      'European': 'You understand European wellness traditions, work-life balance, and cultural approaches to health.',
      'default': 'You understand diverse cultural approaches to health and wellness.'
    };

    const bodyTypeContexts = {
      'ectomorph': 'You understand ectomorphs need more calories, strength training, and consistent eating patterns.',
      'mesomorph': 'You understand mesomorphs respond well to balanced training and moderate calorie intake.',
      'endomorph': 'You understand endomorphs benefit from regular cardio, portion control, and metabolic support.'
    };

    return `You are a personal health coach with deep cultural awareness. ${culturalContexts[culture as keyof typeof culturalContexts] || culturalContexts.default} ${bodyTypeContexts[bodyType as keyof typeof bodyTypeContexts] || ''} Provide short, motivational, and culturally-sensitive messages (2 sentences max).`;
  }

  private getNutritionSystemPrompt(culture: string, bodyType: string): string {
    return `You are a culturally-aware nutritionist specializing in ${culture} cuisine and ${bodyType} body types. Provide practical, culturally-appropriate nutrition suggestions that respect traditional food values while promoting modern health goals.`;
  }

  private getChatSystemPrompt(culture: string, bodyType: string): string {
    return `You are a personal health coach with expertise in ${culture} wellness traditions and ${bodyType} body types. Answer briefly, factually, and motivationally while being culturally sensitive and personally relevant.`;
  }

  private getInsightsSystemPrompt(culture: string, bodyType: string): string {
    return `You are a comprehensive health coach specializing in ${culture} wellness approaches and ${bodyType} body types. Provide detailed insights that are culturally appropriate, personally relevant, and practically actionable.`;
  }

  // Helper methods
  private analyzeProgress(todayLogs: LogEntry[], history: LogEntry[]): string {
    if (todayLogs.length === 0) return 'No activity today - great opportunity to start!';
    
    const todayTotal = todayLogs.reduce((sum, log) => sum + log.value, 0);
    const avgDaily = history.length > 0 ? 
      history.reduce((sum, log) => sum + log.value, 0) / Math.max(history.length, 1) : 0;
    
    if (todayTotal > avgDaily * 1.2) return 'Above average activity today - excellent progress!';
    if (todayTotal > avgDaily * 0.8) return 'Consistent with your usual activity level';
    return 'Lower activity today - consider adding a small healthy habit';
  }

  private analyzeProgressTrends(logs: LogEntry[]): string {
    if (logs.length < 3) return 'Insufficient data for trend analysis';
    
    const recent = logs.slice(-3).reduce((sum, log) => sum + log.value, 0);
    const previous = logs.slice(-6, -3).reduce((sum, log) => sum + log.value, 0);
    
    if (recent > previous * 1.1) return 'Improving trend - keep it up!';
    if (recent < previous * 0.9) return 'Declining trend - time to refocus';
    return 'Stable trend - consistency is key';
  }

  private getCulturalContext(culture: string): string {
    const contexts = {
      'Indian': 'Ayurveda principles, family wellness, traditional spices and herbs',
      'Chinese': 'TCM balance, qi energy, seasonal eating, family harmony',
      'Mexican': 'Family-centered health, traditional foods, community wellness',
      'American': 'Individual goals, modern lifestyle, evidence-based approaches',
      'European': 'Work-life balance, quality over quantity, cultural traditions',
      'default': 'Respect for cultural values and traditional approaches to health'
    };
    return contexts[culture as keyof typeof contexts] || contexts.default;
  }

  private parseNutritionSuggestions(content: string): string[] {
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
      .slice(0, 3);
  }

  private parseEnhancedCoachingResponse(content: string): AICoachResponse {
    const lines = content.split('\n').filter(line => line.trim());
    
    return {
      motivationMessage: lines[0] || 'Keep up the great work!',
      suggestions: lines.slice(1, 4).filter(line => line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')),
      insights: lines.slice(4, 7).filter(line => line.includes('insight') || line.includes('pattern') || line.includes('trend')),
      progressSummary: lines.find(line => line.includes('progress') || line.includes('summary') || line.includes('overall')) || 'You\'re making steady progress!',
      nextSteps: lines.slice(-3).filter(line => line.includes('next') || line.includes('try') || line.includes('consider') || line.includes('focus'))
    };
  }

  // Fallback responses
  private getFallbackResponse(): CoachingResponse {
    return {
      motivation_message: 'You\'re doing great! Keep building those healthy habits!',
      suggestions: ['Stay consistent with your current routine', 'Try adding one small healthy habit today'],
      insights: ['Consistency is key to building lasting habits'],
      progress_summary: 'You\'re on the right track!',
      next_steps: ['Continue with your current routine'],
      cultural_notes: [],
      health_tips: []
    };
  }

  private getFallbackMotivation(profile: UserProfile): string {
    const culturalGreetings = {
      'Indian': 'Namaste! You\'re doing amazing work on your health journey!',
      'Chinese': 'Keep up the excellent work on your wellness path!',
      'Mexican': '¡Excelente! You\'re making great progress on your health goals!',
      'default': 'You\'re doing amazing! Keep building those healthy habits!'
    };
    return culturalGreetings[profile.culture as keyof typeof culturalGreetings] || culturalGreetings.default;
  }

  private getFallbackNutritionSuggestions(profile: UserProfile): string[] {
    const suggestions = {
      'ectomorph': ['Add more healthy fats like nuts and avocados', 'Increase portion sizes gradually'],
      'mesomorph': ['Focus on balanced macronutrients', 'Include variety in your meals'],
      'endomorph': ['Add more fiber-rich foods', 'Focus on portion control and timing']
    };
    return suggestions[profile.bodyType as keyof typeof suggestions] || ['Try adding more vegetables to your next meal!'];
  }

  private getFallbackInsights(): AICoachResponse {
    return {
      motivationMessage: 'You\'re making great progress!',
      suggestions: ['Keep tracking your habits consistently', 'Try adding one new healthy habit this week'],
      insights: ['Consistency is key to building lasting habits', 'Small changes lead to big results'],
      progressSummary: 'You\'re on the right track!',
      nextSteps: ['Continue with your current routine', 'Set a small goal for tomorrow']
    };
  }
}

export const aiCoach = AICoachService.getInstance();