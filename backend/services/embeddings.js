const { vectorDB } = require('./vector-db');
const { weaviateService } = require('./persistent-storage');

class EmbeddingsService {
  constructor() {
    if (EmbeddingsService.instance) {
      return EmbeddingsService.instance;
    }
    EmbeddingsService.instance = this;
  }

  async generateProfileEmbedding(profile) {
    const profileText = `
      User Profile: ${profile.name || 'Unknown'}, ${profile.age} year old ${profile.gender}, 
      ${profile.bodyType} body type, ${profile.culture} background, 
      ${profile.activity_level} activity level, 
      height: ${profile.height}cm, weight: ${profile.weight}kg,
      goals: ${profile.goals.join(', ')}
    `;
    
    return await vectorDB.addDocument(
      `profile_${profile.userId || profile.id}`,
      profileText,
      {
        type: 'profile',
        userId: profile.userId || profile.id,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        bodyType: profile.bodyType,
        culture: profile.culture,
        activityLevel: profile.activity_level,
        goals: profile.goals
      }
    );
  }

  async generateLogEmbedding(log) {
    const logText = `
      Log Entry: ${log.input_method} - ${log.content_preview || log.content || 'Activity logged'}
      User: ${log.user_id}, Timestamp: ${log.timestamp}
    `;
    
    return await vectorDB.addDocument(
      `log_${log.id}`,
      logText,
      {
        type: 'log',
        userId: log.user_id,
        inputMethod: log.input_method,
        timestamp: log.timestamp,
        content: log.content_preview || log.content
      }
    );
  }

  async generateHealthPatternEmbedding(userId, pattern) {
    const patternText = `
      Health Pattern: ${pattern.type} - ${pattern.description}
      User: ${userId}, Success Rate: ${pattern.successRate}%,
      Duration: ${pattern.duration} days, Category: ${pattern.category}
    `;
    
    return await vectorDB.addDocument(
      `pattern_${userId}_${Date.now()}`,
      patternText,
      {
        type: 'pattern',
        userId: userId,
        patternType: pattern.type,
        category: pattern.category,
        successRate: pattern.successRate,
        duration: pattern.duration
      }
    );
  }

  async generateRecommendationEmbedding(recommendation) {
    const recText = `
      Recommendation: ${recommendation.title}
      Category: ${recommendation.category}, 
      Description: ${recommendation.description}
      For: ${recommendation.targetAudience}
    `;
    
    return await vectorDB.addDocument(
      `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recText,
      {
        type: 'recommendation',
        category: recommendation.category,
        title: recommendation.title,
        targetAudience: recommendation.targetAudience
      }
    );
  }

  async indexExistingData() {
    console.log('🔄 Indexing existing data into vector database...');
    
    try {
      // Index all profiles
      const profileDocs = await weaviateService.getDocumentsByType('profile', null, 1000);
      console.log(`Found ${profileDocs.length} profiles to index`);
      
      for (const doc of profileDocs) {
        try {
          await this.generateProfileEmbedding(doc.metadata);
        } catch (error) {
          console.error(`Error indexing profile ${doc.metadata.id}:`, error.message);
        }
      }
      
      // Index all logs
      const logDocs = await weaviateService.getDocumentsByType('log', null, 1000);
      console.log(`Found ${logDocs.length} logs to index`);
      
      for (const doc of logDocs) {
        try {
          await this.generateLogEmbedding(doc.metadata);
        } catch (error) {
          console.error(`Error indexing log ${doc.metadata.id}:`, error.message);
        }
      }
      
      // Add some sample recommendations
      await this.addSampleRecommendations();
      
      console.log('✅ Data indexing completed successfully');
      return { success: true, profiles: profileDocs.length, logs: logDocs.length };
      
    } catch (error) {
      console.error('Error indexing existing data:', error);
      throw error;
    }
  }

  async addSampleRecommendations() {
    const sampleRecommendations = [
      {
        title: "High-Protein Breakfast for Muscle Building",
        category: "nutrition",
        description: "Start your day with Greek yogurt, berries, and nuts for sustained energy and muscle recovery",
        targetAudience: "athletic body type, muscle building goals"
      },
      {
        title: "Cardio for Weight Loss",
        category: "exercise",
        description: "30 minutes of moderate-intensity cardio 5 times per week for effective weight loss",
        targetAudience: "weight loss goals, moderate activity level"
      },
      {
        title: "Mediterranean Diet Benefits",
        category: "nutrition",
        description: "Focus on olive oil, fish, vegetables, and whole grains for heart health and longevity",
        targetAudience: "mediterranean culture, health improvement goals"
      },
      {
        title: "Strength Training for Lean Body Type",
        category: "exercise",
        description: "Compound movements with progressive overload to build lean muscle mass",
        targetAudience: "lean body type, muscle building goals"
      },
      {
        title: "Asian-Inspired Healthy Meals",
        category: "nutrition",
        description: "Steamed fish with brown rice and vegetables for balanced nutrition",
        targetAudience: "asian culture, health improvement goals"
      },
      {
        title: "Consistent Sleep Schedule",
        category: "lifestyle",
        description: "Maintain regular sleep hours for better recovery and health outcomes",
        targetAudience: "all body types, health improvement goals"
      }
    ];
    
    for (const rec of sampleRecommendations) {
      try {
        await this.generateRecommendationEmbedding(rec);
      } catch (error) {
        console.error(`Error adding recommendation:`, error.message);
      }
    }
  }

  async findSimilarUsersForInsights(userProfile) {
    try {
      const similarUsers = await vectorDB.findSimilarUsers(userProfile, {
        limit: 3,
        threshold: 0.75
      });
      
      return similarUsers.map(user => ({
        id: user.id,
        similarity: user.similarity,
        profile: user.metadata,
        insights: `User with similar profile (${user.similarity.toFixed(2)} similarity)`
      }));
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  async findRelevantRecommendations(userProfile, userLogs) {
    try {
      const recommendations = await vectorDB.getRecommendations(userProfile, userLogs, {
        limit: 5,
        types: ['nutrition', 'exercise', 'lifestyle']
      });
      
      return recommendations;
    } catch (error) {
      console.error('Error finding relevant recommendations:', error);
      return [];
    }
  }

  async analyzeUserPatterns(userId, days = 30) {
    try {
      const trends = await vectorDB.analyzeTrends(userId, {
        timeframe: days,
        categories: ['all']
      });
      
      return trends;
    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return null;
    }
  }

  async generateAIResponseEmbedding(response, context) {
    const responseText = `
      AI Response: ${response}
      Context: ${context.type} - User: ${context.userId}
      Profile: ${context.profile?.bodyType} body type, ${context.profile?.culture} culture
      Goals: ${context.profile?.goals?.join(', ')}
      Generated: ${new Date().toISOString()}
    `;
    
    return await vectorDB.addDocument(
      `ai_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      responseText,
      {
        type: 'ai_response',
        responseType: context.type,
        userId: context.userId,
        profile: context.profile,
        originalResponse: response,
        context: context,
        timestamp: new Date().toISOString(),
        model: context.model || 'gpt-3.5-turbo',
        tokens: context.tokens || 0
      }
    );
  }

  async saveInsightsResponse(insights, profile, logs, days) {
    try {
      const context = {
        type: 'insights',
        userId: profile.userId || profile.id,
        profile: profile,
        logs: logs,
        days: days,
        model: 'gpt-3.5-turbo'
      };

      // Save each component of the insights
      if (insights.summary) {
        await this.generateAIResponseEmbedding(insights.summary, {
          ...context,
          type: 'insights_summary'
        });
      }

      if (insights.motivation) {
        await this.generateAIResponseEmbedding(insights.motivation, {
          ...context,
          type: 'motivation'
        });
      }

      if (insights.suggestions && insights.suggestions.length > 0) {
        await this.generateAIResponseEmbedding(insights.suggestions.join('\n'), {
          ...context,
          type: 'suggestions'
        });
      }

      if (insights.dinnerRecommendation) {
        await this.generateAIResponseEmbedding(insights.dinnerRecommendation, {
          ...context,
          type: 'dinner_recommendation'
        });
      }

      console.log('✅ Saved AI insights responses to vector database');
      return { success: true, saved: Object.keys(insights).length };
    } catch (error) {
      console.error('Error saving insights response:', error);
      return { success: false, error: error.message };
    }
  }

  async saveCoachingResponse(response, profile, logs, userMessage) {
    try {
      const context = {
        type: 'coaching',
        userId: profile.userId || profile.id,
        profile: profile,
        logs: logs,
        userMessage: userMessage,
        model: 'gpt-3.5-turbo'
      };

      await this.generateAIResponseEmbedding(response, context);
      console.log('✅ Saved AI coaching response to vector database');
      return { success: true };
    } catch (error) {
      console.error('Error saving coaching response:', error);
      return { success: false, error: error.message };
    }
  }

  async findSimilarResponses(query, options = {}) {
    const {
      limit = 5,
      threshold = 0.7,
      responseType = null,
      userId = null
    } = options;

    const where = { type: 'ai_response' };
    if (responseType) where.responseType = responseType;
    if (userId) where.userId = userId;

    return await vectorDB.searchSimilar(query, {
      limit,
      threshold,
      where
    });
  }

  async getResponseHistory(userId, options = {}) {
    const {
      limit = 10,
      responseType = null
    } = options;

    const where = { type: 'ai_response', userId: userId };
    if (responseType) where.responseType = responseType;

    return await vectorDB.searchSimilar('AI response history', {
      limit,
      threshold: 0.1, // Very low threshold to get all responses
      where
    });
  }

  async getUserContextForPrompts(userId, profile, logs, days) {
    try {
      console.log(`🔍 Fetching user context for ${userId} from vector database...`);
      
      // Get user's past AI responses
      const pastResponses = await this.getResponseHistory(userId, { limit: 5 });
      
      // Get user's successful patterns and insights
      const userPatterns = await vectorDB.searchSimilar(
        `successful patterns for ${profile.bodyType} body type ${profile.culture} culture user ${userId}`,
        {
          limit: 3,
          threshold: 0.6,
          where: { 
            type: 'ai_response', 
            userId: userId,
            responseType: 'insights_summary'
          }
        }
      );

      // Get user's past recommendations that worked well
      const pastRecommendations = await vectorDB.searchSimilar(
        `recommendations for ${profile.goals.join(' ')} user ${userId}`,
        {
          limit: 3,
          threshold: 0.6,
          where: { 
            type: 'ai_response', 
            userId: userId,
            responseType: { $in: ['suggestions', 'dinner_recommendation'] }
          }
        }
      );

      // Build context summary
      const context = {
        pastResponses: pastResponses.map(r => ({
          type: r.metadata.responseType,
          content: r.metadata.originalResponse,
          timestamp: r.timestamp,
          similarity: r.similarity
        })),
        successfulPatterns: userPatterns.map(p => ({
          content: p.metadata.originalResponse,
          timestamp: p.timestamp,
          similarity: p.similarity
        })),
        pastRecommendations: pastRecommendations.map(r => ({
          type: r.metadata.responseType,
          content: r.metadata.originalResponse,
          timestamp: r.timestamp,
          similarity: r.similarity
        })),
        totalInteractions: pastResponses.length,
        lastInteraction: pastResponses.length > 0 ? pastResponses[0].timestamp : null
      };

      console.log(`✅ Found ${pastResponses.length} past responses, ${userPatterns.length} patterns, ${pastRecommendations.length} recommendations`);
      return context;
      
    } catch (error) {
      console.error('Error fetching user context:', error);
      return {
        pastResponses: [],
        successfulPatterns: [],
        pastRecommendations: [],
        totalInteractions: 0,
        lastInteraction: null
      };
    }
  }

  async getVectorStats() {
    try {
      return await vectorDB.getStats();
    } catch (error) {
      console.error('Error getting vector stats:', error);
      return null;
    }
  }
}

module.exports = { embeddingsService: new EmbeddingsService() };
