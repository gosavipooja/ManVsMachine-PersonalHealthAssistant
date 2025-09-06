require('dotenv').config();
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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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

  async generateDinnerRecommendation(profile, logs, foodContext = null) {
    const prompt = this.buildDinnerPrompt(profile, logs, foodContext);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist and personal chef. Provide a specific, culturally-appropriate dinner recommendation based on the user\'s profile, goals, recent activity, and food intake. Consider macro balance and what they\'ve already eaten today. Be practical and encouraging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'Consider a balanced meal with lean protein and vegetables.';
    } catch (error) {
      console.error('Error generating dinner recommendation:', error);
      return 'For tonight\'s dinner, I recommend a balanced meal with lean protein and plenty of vegetables.';
    }
  }

  // NEW: Single optimized method that combines all insights generation
  async generateAllInsights(profile, logs, days, foodContext = null, includeRecommendations = true) {
    const prompt = this.buildCombinedInsightsPrompt(profile, logs, days, foodContext, includeRecommendations);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a comprehensive personal health coach${includeRecommendations ? ' and nutritionist' : ''}. Provide a complete health analysis including personalized summary, motivation, suggestions, insights, progress summary, and next steps${includeRecommendations ? ', and dinner recommendation' : ''}. Be encouraging, specific, culturally aware, and practical.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseCombinedResponse(content, includeRecommendations);
    } catch (error) {
      console.error('Error generating combined insights:', error);
      return this.getFallbackResponse(includeRecommendations);
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

  buildDinnerPrompt(profile, logs, foodContext = null) {
    const recentFood = logs.filter(log => log.input_method === 'text' || log.input_method === 'photo')
      .slice(0, 3)
      .map(log => log.content_preview || log.content || 'meal logged')
      .join(', ');

    let foodContextSection = '';
    if (foodContext && foodContext.hasRecentFood) {
      foodContextSection = `

RECENT FOOD INTAKE ANALYSIS:
Recent Food Logs: ${foodContext.recentFoodLogs.map(log => `${log.method}: ${log.content}`).join(', ')}

MACRO BALANCE ANALYSIS:
- Needs Protein: ${foodContext.foodAnalysis.needsProtein ? 'YES' : 'NO'} ${foodContext.foodAnalysis.proteinSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.proteinSources.join(', ')})` : ''}
- Needs Carbs: ${foodContext.foodAnalysis.needsCarbs ? 'YES' : 'NO'} ${foodContext.foodAnalysis.carbSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.carbSources.join(', ')})` : ''}
- Needs Fats: ${foodContext.foodAnalysis.needsFats ? 'YES' : 'NO'} ${foodContext.foodAnalysis.fatSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.fatSources.join(', ')})` : ''}
- Needs Vegetables: ${foodContext.foodAnalysis.needsVegetables ? 'YES' : 'NO'} ${foodContext.foodAnalysis.vegetables.length > 0 ? `(Already had: ${foodContext.foodAnalysis.vegetables.join(', ')})` : ''}

RECOMMENDED FOCUS: ${this.getMacroFocus(foodContext.foodAnalysis)}

IMPORTANT: Create a dinner recommendation that addresses the macro gaps identified above to ensure a balanced diet.`;
    }

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Activity Level: ${profile.activity_level}
Recent Meals: ${recentFood || 'No recent meals logged'}${foodContextSection}

Suggest a specific dinner recommendation that aligns with their goals, body type, and cultural preferences. Be practical and encouraging.${foodContext && foodContext.hasRecentFood ? ' Focus on balancing their daily macro intake based on the analysis above.' : ''}
    `.trim();
  }

  getMacroFocus(foodAnalysis) {
    const needs = [];
    if (foodAnalysis.needsProtein) needs.push('PROTEIN');
    if (foodAnalysis.needsCarbs) needs.push('CARBS');
    if (foodAnalysis.needsFats) needs.push('HEALTHY FATS');
    if (foodAnalysis.needsVegetables) needs.push('VEGETABLES');
    
    if (needs.length === 0) return 'BALANCED - All macros covered, focus on variety and micronutrients';
    if (needs.length === 1) return `PRIORITY: ${needs[0]}`;
    if (needs.length === 2) return `PRIORITY: ${needs.join(' and ')}`;
    return `PRIORITY: ${needs.slice(0, -1).join(', ')} and ${needs[needs.length - 1]}`;
  }

  buildCombinedInsightsPrompt(profile, logs, days, foodContext = null, includeRecommendations = true) {
    const timeframe = days === 1 ? 'today' : `the past ${days} days`;
    const recentActivity = logs.slice(0, 5).map(log => {
      const method = log.input_method;
      const content = log.content_preview || log.content || 'Activity logged';
      return `${method}: ${content}`;
    }).join(', ');

    let foodContextSection = '';
    if (includeRecommendations && foodContext && foodContext.hasRecentFood) {
      foodContextSection = `

RECENT FOOD INTAKE ANALYSIS:
Recent Food Logs: ${foodContext.recentFoodLogs.map(log => `${log.method}: ${log.content}`).join(', ')}

MACRO BALANCE ANALYSIS:
- Needs Protein: ${foodContext.foodAnalysis.needsProtein ? 'YES' : 'NO'} ${foodContext.foodAnalysis.proteinSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.proteinSources.join(', ')})` : ''}
- Needs Carbs: ${foodContext.foodAnalysis.needsCarbs ? 'YES' : 'NO'} ${foodContext.foodAnalysis.carbSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.carbSources.join(', ')})` : ''}
- Needs Fats: ${foodContext.foodAnalysis.needsFats ? 'YES' : 'NO'} ${foodContext.foodAnalysis.fatSources.length > 0 ? `(Already had: ${foodContext.foodAnalysis.fatSources.join(', ')})` : ''}
- Needs Vegetables: ${foodContext.foodAnalysis.needsVegetables ? 'YES' : 'NO'} ${foodContext.foodAnalysis.vegetables.length > 0 ? `(Already had: ${foodContext.foodAnalysis.vegetables.join(', ')})` : ''}

RECOMMENDED FOCUS: ${this.getMacroFocus(foodContext.foodAnalysis)}`;
    }

    return `
User Profile: ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.culture} background
Goals: ${profile.goals.join(', ')}
Activity Level: ${profile.activity_level}
Recent Activity (${timeframe}): ${recentActivity || 'No recent activity logged'}${foodContextSection}

IMPORTANT: Respond ONLY with valid JSON in the exact format below. Do not include any other text or explanations:

{
  "summary": "A personalized summary of their recent progress and activity (2-3 sentences, encouraging and specific)",
  "motivation": "A motivational message (1-2 sentences)",
  "suggestions": ["2-3 practical suggestions for improvement"],
  "keyInsights": ["2-3 key insights about their progress"],
  "progressSummary": "A brief progress summary (1-2 sentences)",
  "nextSteps": ["2-3 next steps for improvement"]${includeRecommendations ? ',\n  "dinnerRecommendation": "A specific, culturally-appropriate dinner recommendation that addresses macro balance and aligns with their goals"' : ''}
}

Be encouraging, specific, culturally aware, and practical.${includeRecommendations && foodContext && foodContext.hasRecentFood ? ' Focus on balancing their daily macro intake in the dinner recommendation.' : ''}
    `.trim();
  }

  parseCombinedResponse(content, includeRecommendations = true) {
    try {
      // Try to extract JSON from the response (in case it's wrapped in text)
      let jsonContent = content;
      
      // Look for JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonContent);
      return {
        summary: parsed.summary || 'Keep up the great work on your health journey!',
        motivation: parsed.motivation || 'You\'re making great progress!',
        suggestions: parsed.suggestions || ['Keep tracking your habits consistently'],
        keyInsights: parsed.keyInsights || ['Consistency is key to building lasting habits'],
        progressSummary: parsed.progressSummary || 'You\'re on the right track!',
        nextSteps: parsed.nextSteps || ['Continue with your current routine'],
        dinnerRecommendation: includeRecommendations ? (parsed.dinnerRecommendation || 'Consider a balanced meal with lean protein and vegetables.') : null
      };
    } catch (error) {
      // Fallback parsing if JSON fails
      console.log('JSON parsing failed, using fallback parsing:', error.message);
      console.log('Content received:', content.substring(0, 200) + '...');
      
      // Try to extract individual components from the text
      const lines = content.split('\n').filter(line => line.trim());
      return {
        summary: lines.find(line => line.includes('summary') || line.includes('progress')) || 'Keep up the great work on your health journey!',
        motivation: lines.find(line => line.includes('motivation') || line.includes('encouraging')) || 'You\'re making great progress!',
        suggestions: lines.filter(line => line.includes('•') || line.includes('-')).slice(0, 3),
        keyInsights: lines.filter(line => line.includes('insight') || line.includes('pattern')).slice(0, 3),
        progressSummary: lines.find(line => line.includes('progress') || line.includes('summary')) || 'You\'re on the right track!',
        nextSteps: lines.filter(line => line.includes('next') || line.includes('try') || line.includes('consider')).slice(0, 3),
        dinnerRecommendation: includeRecommendations ? (lines.find(line => line.includes('dinner') || line.includes('meal')) || 'Consider a balanced meal with lean protein and vegetables.') : null
      };
    }
  }

  getFallbackResponse(includeRecommendations = true) {
    return {
      summary: 'You\'re making great progress on your health goals!',
      motivation: 'Keep up the great work!',
      suggestions: ['Keep tracking your habits consistently'],
      keyInsights: ['Consistency is key to building lasting habits'],
      progressSummary: 'You\'re on the right track!',
      nextSteps: ['Continue with your current routine'],
      dinnerRecommendation: includeRecommendations ? 'Consider a balanced meal with lean protein and vegetables.' : null
    };
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
