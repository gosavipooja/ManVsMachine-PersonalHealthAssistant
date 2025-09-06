const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AICoachService {
  constructor() {
    if (AICoachService.instance) {
      return AICoachService.instance;
    }
    AICoachService.instance = this;
  }

  async generateDailyMotivation(profile, todayLogs, history) {
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

  async generateNutritionSuggestions(profile, foodLogs) {
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

  async generateCoachingResponse(profile, logs, userMessage) {
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

  async generateComprehensiveInsights(profile, logs) {
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

  buildMotivationPrompt(profile, todayLogs, history) {
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

  buildNutritionPrompt(profile, foodLogs) {
    const recentFood = foodLogs.slice(-3).map(log => 
      log.metadata?.foodItems?.join(', ') || log.notes || 'Unknown food'
    ).join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Recent Food Intake: ${recentFood}

Suggest 1-2 practical nutrition improvements considering their body type and cultural background.
    `.trim();
  }

  buildChatPrompt(profile, logs, userMessage) {
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

  buildInsightsPrompt(profile, logs) {
    const weeklyLogs = logs.slice(-7);
    const habitSummary = weeklyLogs.reduce((acc, log) => {
      acc[log.habitId] = (acc[log.habitId] || 0) + log.value;
      return acc;
    }, {});

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

  async generatePersonalizedSummary(profile, logs, days) {
    const prompt = this.buildSummaryPrompt(profile, logs, days);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a personal health coach. Provide a personalized summary of the user\'s recent activity and progress. Be encouraging, specific, and culturally aware.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Keep up the great work on your health journey!';
    } catch (error) {
      console.error('Error generating personalized summary:', error);
      return 'You\'re making great progress on your health goals!';
    }
  }

  async generateDinnerRecommendation(profile, logs) {
    const prompt = this.buildDinnerPrompt(profile, logs);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist and personal chef. Provide a specific, culturally-appropriate dinner recommendation based on the user\'s profile, goals, and recent activity. Be practical and encouraging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.6,
      });

      return response.choices[0]?.message?.content || 'Consider a balanced meal with lean protein and vegetables.';
    } catch (error) {
      console.error('Error generating dinner recommendation:', error);
      return 'For tonight\'s dinner, I recommend a balanced meal with lean protein and plenty of vegetables.';
    }
  }

  buildSummaryPrompt(profile, logs, days) {
    const timeframe = days === 1 ? 'today' : `the past ${days} days`;
    const recentActivity = logs.slice(0, 5).map(log => {
      const method = log.input_method;
      const content = log.content_preview || log.content || 'Activity logged';
      return `${method}: ${content}`;
    }).join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Activity Level: ${profile.activity_level}
Recent Activity (${timeframe}): ${recentActivity || 'No recent activity logged'}

Write a personalized summary of their recent progress and activity. Be encouraging and specific about their achievements.
    `.trim();
  }

  buildDinnerPrompt(profile, logs) {
    const recentFood = logs.filter(log => log.input_method === 'text' || log.input_method === 'photo')
      .slice(0, 3)
      .map(log => log.content_preview || log.content || 'meal logged')
      .join(', ');

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Activity Level: ${profile.activity_level}
Recent Meals: ${recentFood || 'No recent meals logged'}

Suggest a specific dinner recommendation that aligns with their goals, body type, and cultural preferences. Be practical and encouraging.
    `.trim();
  }

  parseCoachingResponse(content) {
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

module.exports = { aiCoach: new AICoachService() };
