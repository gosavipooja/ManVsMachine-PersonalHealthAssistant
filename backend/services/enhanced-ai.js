const OpenAI = require('openai');
const { weaviateService } = require('./persistent-storage');
const { simpleVectorDB } = require('./simple-vector-db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class EnhancedAIService {
  constructor() {
    if (EnhancedAIService.instance) {
      return EnhancedAIService.instance;
    }
    EnhancedAIService.instance = this;
    this.storage = weaviateService;
    this.vectorDB = simpleVectorDB;
  }

  /**
   * Fetch user profile data from vector database
   * @param {string} userId - User ID
   * @returns {Object|null} User profile data
   */
  async fetchUserProfile(userId) {
    try {
      const profileDocs = await this.vectorDB.getDocumentsByType('profile', userId, 1);
      if (profileDocs && profileDocs.length > 0) {
        // Parse the original data from metadata
        const metadata = profileDocs[0].metadata;
        if (metadata.original_data) {
          return JSON.parse(metadata.original_data);
        }
        return profileDocs[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile from vector DB:', error);
      // Fallback to persistent storage
      try {
        const profileDocs = await this.storage.getDocumentsByType('profile', userId, 1);
        if (profileDocs && profileDocs.length > 0) {
          return profileDocs[0];
        }
      } catch (fallbackError) {
        console.error('Error fetching user profile from persistent storage:', fallbackError);
      }
      return null;
    }
  }

  /**
   * Fetch historical context from vector DB
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Object} Historical context
   */
  async fetchHistoricalContext(userId, days = 7) {
    try {
      // Get recent documents from vector DB
      const recentData = await this.vectorDB.getRecentDocuments(userId, days, 50);
      
      if (recentData.success) {
        const documents = recentData.documents;
        
        // Parse food documents
        const recentFood = documents.food.map(doc => {
          const metadata = doc.metadata;
          if (metadata.original_data) {
            return JSON.parse(metadata.original_data);
          }
          return doc;
        });
        
        // Parse exercise documents
        const recentExercise = documents.exercise.map(doc => {
          const metadata = doc.metadata;
          if (metadata.original_data) {
            return JSON.parse(metadata.original_data);
          }
          return doc;
        });

        return {
          recentFood,
          recentExercise,
          totalFoodItems: recentFood.length,
          totalExerciseActivities: recentExercise.length,
          dateRange: recentData.date_range
        };
      } else {
        throw new Error(recentData.error);
      }
    } catch (error) {
      console.error('Error fetching historical context from vector DB:', error);
      // Fallback to persistent storage
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const [foodDocs, exerciseDocs] = await Promise.all([
          this.storage.getDocumentsByType('food', userId, 50),
          this.storage.getDocumentsByType('exercise', userId, 50)
        ]);

        const recentFood = foodDocs.filter(doc => new Date(doc.timestamp) >= cutoffDate);
        const recentExercise = exerciseDocs.filter(doc => new Date(doc.timestamp) >= cutoffDate);

        return {
          recentFood,
          recentExercise,
          totalFoodItems: recentFood.length,
          totalExerciseActivities: recentExercise.length,
          dateRange: {
            from: cutoffDate.toISOString(),
            to: new Date().toISOString()
          }
        };
      } catch (fallbackError) {
        console.error('Error fetching historical context from persistent storage:', fallbackError);
        return {
          recentFood: [],
          recentExercise: [],
          totalFoodItems: 0,
          totalExerciseActivities: 0,
          dateRange: { from: null, to: null }
        };
      }
    }
  }

  /**
   * Process and save logging data
   * @param {Object} data - Logging data
   * @returns {Object} Processing result
   */
  async processLoggingData(data) {
    try {
      console.log('📝 Processing logging data:', JSON.stringify(data, null, 2));

      const { proposed_logs } = data;
      const savedItems = [];

      for (const log of proposed_logs) {
        const logData = {
          id: this.generateId(),
          type: log.type,
          userId: log.user_id,
          timestamp: log.timestamp || new Date().toISOString(),
          data: log,
          metadata: {
            type: log.type,
            userId: log.user_id,
            timestamp: log.timestamp || new Date().toISOString(),
            source: log.source || 'api',
            provenance: log.provenance || {}
          }
        };

        // Save to both vector DB and persistent storage
        try {
          await this.vectorDB.addDocument(logData);
          console.log(`✅ Saved ${log.type} log to vector DB: ${logData.id}`);
        } catch (vectorError) {
          console.error('Error saving to vector DB, falling back to persistent storage:', vectorError);
          await this.storage.addDocument(logData);
          console.log(`✅ Saved ${log.type} log to persistent storage: ${logData.id}`);
        }
        
        savedItems.push({
          id: logData.id,
          type: log.type,
          timestamp: logData.timestamp
        });
      }

      return {
        success: true,
        savedItems,
        count: savedItems.length
      };
    } catch (error) {
      console.error('Error processing logging data:', error);
      throw error;
    }
  }

  /**
   * Generate personalized dinner recommendation
   * @param {string} userId - User ID
   * @returns {Object} Dinner recommendation
   */
  async generateDinnerRecommendation(userId) {
    try {
      console.log('🍽️ Generating dinner recommendation for user:', userId);

      // Fetch user profile and historical context
      const [userProfile, historicalContext] = await Promise.all([
        this.fetchUserProfile(userId),
        this.fetchHistoricalContext(userId, 3) // Last 3 days
      ]);

      // Build context for AI
      let userContext = '';
      if (userProfile && userProfile.metadata) {
        const profile = userProfile.metadata;
        userContext = `
User Profile:
- Name: ${profile.name || 'Unknown'}
- Age: ${profile.age || 'Unknown'} years old
- Gender: ${profile.gender || 'Unknown'}
- Height: ${profile.height || 'Unknown'} cm
- Weight: ${profile.weight || 'Unknown'} kg
- Body Type: ${profile.bodyType || 'Unknown'}
- Cultural Background: ${profile.culture || 'Unknown'}
- Activity Level: ${profile.activity_level || 'Unknown'}
- Health Goals: ${profile.goals ? profile.goals.join(', ') : 'Not specified'}`;
      } else {
        userContext = 'User Profile: Not available - providing general recommendations';
      }

      // Build recent activity context
      const recentFoodSummary = historicalContext.recentFood
        .slice(-10) // Last 10 food items
        .map(item => {
          const data = item.metadata?.data || item.data;
          if (data?.items) {
            return data.items.map(food => `${food.quantity} ${food.unit} of ${food.name}`).join(', ');
          }
          return data?.name || 'Unknown food';
        })
        .join('; ');

      const recentExerciseSummary = historicalContext.recentExercise
        .slice(-5) // Last 5 exercises
        .map(item => {
          const data = item.metadata?.data || item.data;
          return `${data?.activity || 'Unknown activity'} for ${data?.duration_min || 0} minutes`;
        })
        .join('; ');

      const prompt = `As a professional nutritionist and health coach, provide a personalized dinner recommendation:

${userContext}

Recent Activity (Last 3 Days):
- Food consumed: ${recentFoodSummary || 'No recent food data'}
- Exercise performed: ${recentExerciseSummary || 'No recent exercise data'}
- Total food items logged: ${historicalContext.totalFoodItems}
- Total exercise activities: ${historicalContext.totalExerciseActivities}

Please provide a comprehensive dinner recommendation that considers:
1. User's health goals and body type
2. Recent food intake to avoid repetition and ensure variety
3. Recent exercise to balance nutrition needs
4. Cultural preferences and dietary patterns
5. Time of day (dinner recommendations)

Format your response as JSON with keys: "recommendation", "reasoning", "nutritional_benefits", "preparation_tips", "alternatives"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist and health coach. Provide personalized, practical dinner recommendations in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const aiRecommendation = JSON.parse(content);

      return {
        success: true,
        recommendation: aiRecommendation,
        context: {
          userProfile: userProfile ? userProfile.metadata : null,
          historicalContext: {
            totalFoodItems: historicalContext.totalFoodItems,
            totalExerciseActivities: historicalContext.totalExerciseActivities,
            dateRange: historicalContext.dateRange
          }
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating dinner recommendation:', error);
      throw error;
    }
  }

  /**
   * Generate daily insights summary
   * @param {string} userId - User ID
   * @returns {Object} Daily insights
   */
  async generateDailyInsights(userId) {
    try {
      console.log('📊 Generating daily insights for user:', userId);

      // Get today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch user profile and today's data
      const [userProfile, foodDocs, exerciseDocs] = await Promise.all([
        this.fetchUserProfile(userId),
        this.vectorDB.getDocumentsByType('food', userId, 100).catch(() => this.storage.getDocumentsByType('food', userId, 100)),
        this.vectorDB.getDocumentsByType('exercise', userId, 100).catch(() => this.storage.getDocumentsByType('exercise', userId, 100))
      ]);

      // Filter today's data
      const todayFood = foodDocs.filter(doc => {
        const docDate = new Date(doc.timestamp);
        return docDate >= today && docDate < tomorrow;
      });

      const todayExercise = exerciseDocs.filter(doc => {
        const docDate = new Date(doc.timestamp);
        return docDate >= today && docDate < tomorrow;
      });

      // Build context for AI
      let userContext = '';
      if (userProfile && userProfile.metadata) {
        const profile = userProfile.metadata;
        userContext = `
User Profile:
- Name: ${profile.name || 'Unknown'}
- Age: ${profile.age || 'Unknown'} years old
- Gender: ${profile.gender || 'Unknown'}
- Body Type: ${profile.bodyType || 'Unknown'}
- Health Goals: ${profile.goals ? profile.goals.join(', ') : 'Not specified'}`;
      }

      // Build today's activity summary
      const todayFoodSummary = todayFood.map(item => {
        const data = item.metadata?.data || item.data;
        if (data?.items) {
          return data.items.map(food => `${food.quantity} ${food.unit} of ${food.name}`).join(', ');
        }
        return data?.name || 'Unknown food';
      }).join('; ');

      const todayExerciseSummary = todayExercise.map(item => {
        const data = item.metadata?.data || item.data;
        return `${data?.activity || 'Unknown activity'} for ${data?.duration_min || 0} minutes`;
      }).join('; ');

      const prompt = `As a health coach, provide a daily insights summary:

${userContext}

Today's Activity (${today.toDateString()}):
- Food consumed: ${todayFoodSummary || 'No food logged today'}
- Exercise performed: ${todayExerciseSummary || 'No exercise logged today'}
- Total food items: ${todayFood.length}
- Total exercise activities: ${todayExercise.length}

Please provide a comprehensive daily summary that includes:
1. Overall assessment of the day's health activities
2. Key achievements and positive patterns
3. Areas for improvement or attention
4. Tomorrow's focus areas based on goals
5. Motivational message

Format your response as JSON with keys: "daily_assessment", "achievements", "improvements", "tomorrow_focus", "motivation"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a supportive health coach. Provide encouraging daily insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const aiInsights = JSON.parse(content);

      return {
        success: true,
        insights: aiInsights,
        summary: {
          date: today.toISOString().split('T')[0],
          totalFoodItems: todayFood.length,
          totalExerciseActivities: todayExercise.length,
          foodItems: todayFood.map(item => item.metadata?.data || item.data),
          exerciseActivities: todayExercise.map(item => item.metadata?.data || item.data)
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating daily insights:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = { enhancedAIService: new EnhancedAIService() };
