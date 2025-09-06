const OpenAI = require('openai');
const { weaviateService } = require('./persistent-storage');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class StructuredAIService {
  constructor() {
    if (StructuredAIService.instance) {
      return StructuredAIService.instance;
    }
    StructuredAIService.instance = this;
    this.storage = weaviateService;
  }

  /**
   * Fetch user profile data from storage
   * @param {string} userId - User ID
   * @returns {Object|null} User profile data
   */
  async fetchUserProfile(userId) {
    try {
      const profileDocs = await this.storage.getDocumentsByType('profile', userId, 1);
      if (profileDocs && profileDocs.length > 0) {
        return profileDocs[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Process structured health data and generate AI insights
   * @param {Object} data - Structured input data
   * @param {Array} data.food - Array of food items
   * @param {Array} data.exercise - Array of exercise activities
   * @param {Object} data.meta - Metadata including user_id, confidence scores
   * @returns {Object} AI insights and recommendations
   */
  async processHealthData(data) {
    try {
      console.log('🤖 Processing structured health data:', JSON.stringify(data, null, 2));

      // Extract and format the data
      const foodItems = data.food || [];
      const exerciseItems = data.exercise || [];
      const meta = data.meta || {};
      
      // Fetch user profile for personalized recommendations
      const userProfile = await this.fetchUserProfile(meta.user_id);
      if (userProfile) {
        console.log('👤 Using user profile for personalized recommendations:', userProfile.metadata.name);
      } else {
        console.log('⚠️ No user profile found, using generic recommendations');
      }
      
      // Generate different types of insights
      const [nutritionInsights, exerciseInsights, overallInsights] = await Promise.all([
        this.generateNutritionInsights(foodItems, userProfile, meta.confidence?.food),
        this.generateExerciseInsights(exerciseItems, userProfile, meta.confidence?.exercise),
        this.generateOverallInsights(foodItems, exerciseItems, userProfile, meta)
      ]);

      return {
        success: true,
        data: {
          nutrition: nutritionInsights,
          exercise: exerciseInsights,
          overall: overallInsights,
          meta: {
            processed_at: new Date().toISOString(),
            confidence_scores: meta.confidence || {},
            user_id: meta.user_id || 'unknown'
          }
        }
      };

    } catch (error) {
      console.error('❌ Error processing health data:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Generate nutrition insights from food data
   */
  async generateNutritionInsights(foodItems, userProfile, confidence) {
    if (!foodItems || foodItems.length === 0) {
      return {
        message: "No food data provided",
        recommendations: [],
        analysis: "Unable to analyze nutrition without food data"
      };
    }

    const foodSummary = foodItems.map(item => 
      `${item.quantity} ${item.unit} of ${item.name}`
    ).join(', ');

    // Build personalized context
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
- Health Goals: ${profile.goals ? profile.goals.join(', ') : 'Not specified'}`;
    } else {
      userContext = 'User Profile: Not available - providing general recommendations';
    }

    const prompt = `As a professional nutritionist, analyze this food intake and provide personalized insights:

Food consumed: ${foodSummary}
${userContext}
Data confidence: ${confidence ? (confidence * 100).toFixed(0) + '%' : 'Unknown'}

Please provide personalized nutrition advice considering the user's profile, goals, and body type:
1. A brief nutritional analysis (2-3 sentences) tailored to their profile
2. 2-3 specific recommendations for improvement based on their goals
3. Any concerns or positive aspects relevant to their body type and age

Format your response as JSON with keys: "analysis", "recommendations" (array), "concerns", "positives"`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist. Provide accurate, helpful nutritional advice in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating nutrition insights:', error);
      return {
        analysis: "Unable to generate nutrition analysis at this time",
        recommendations: ["Consider logging more detailed food information"],
        concerns: [],
        positives: []
      };
    }
  }

  /**
   * Generate exercise insights from exercise data
   */
  async generateExerciseInsights(exerciseItems, userProfile, confidence) {
    if (!exerciseItems || exerciseItems.length === 0) {
      return {
        message: "No exercise data provided",
        recommendations: [],
        analysis: "Unable to analyze exercise without activity data"
      };
    }

    const exerciseSummary = exerciseItems.map(item => {
      let summary = item.activity;
      if (item.duration_min) summary += ` for ${item.duration_min} minutes`;
      if (item.distance_miles) summary += ` (${item.distance_miles} miles)`;
      return summary;
    }).join(', ');

    // Build personalized context for exercise
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
- Health Goals: ${profile.goals ? profile.goals.join(', ') : 'Not specified'}`;
    } else {
      userContext = 'User Profile: Not available - providing general recommendations';
    }

    const prompt = `As a professional fitness trainer, analyze this exercise activity and provide personalized insights:

Exercise performed: ${exerciseSummary}
${userContext}
Data confidence: ${confidence ? (confidence * 100).toFixed(0) + '%' : 'Unknown'}

Please provide personalized fitness advice considering the user's profile, body type, and goals:
1. A brief fitness analysis (2-3 sentences) tailored to their age, body type, and goals
2. 2-3 specific recommendations for improvement based on their fitness level and objectives
3. Any concerns or positive aspects relevant to their body type and health goals

Format your response as JSON with keys: "analysis", "recommendations" (array), "concerns", "positives"`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness trainer. Provide accurate, helpful exercise advice in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating exercise insights:', error);
      return {
        analysis: "Unable to generate exercise analysis at this time",
        recommendations: ["Consider logging more detailed exercise information"],
        concerns: [],
        positives: []
      };
    }
  }

  /**
   * Generate overall health insights
   */
  async generateOverallInsights(foodItems, exerciseItems, userProfile, meta) {
    const hasFood = foodItems && foodItems.length > 0;
    const hasExercise = exerciseItems && exerciseItems.length > 0;

    // Build comprehensive user context
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
- Health Goals: ${profile.goals ? profile.goals.join(', ') : 'Not specified'}`;
    } else {
      userContext = 'User Profile: Not available - providing general health guidance';
    }

    const prompt = `As a holistic health coach, provide personalized overall insights based on this data:

Food logged: ${hasFood ? foodItems.length + ' items' : 'None'}
Exercise logged: ${hasExercise ? exerciseItems.length + ' activities' : 'None'}
${userContext}
Data confidence: Food ${meta.confidence?.food ? (meta.confidence.food * 100).toFixed(0) + '%' : 'Unknown'}, Exercise ${meta.confidence?.exercise ? (meta.confidence.exercise * 100).toFixed(0) + '%' : 'Unknown'}

Please provide personalized holistic health guidance considering the user's profile, goals, and body type:
1. Overall health assessment (2-3 sentences) tailored to their specific goals and body type
2. Key recommendations for the day based on their health objectives
3. Motivational message that resonates with their personal goals and cultural background

Format your response as JSON with keys: "assessment", "recommendations" (array), "motivation"`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a holistic health coach. Provide encouraging, actionable health advice in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating overall insights:', error);
      return {
        assessment: "Keep up the great work with your health tracking!",
        recommendations: ["Continue logging your daily activities"],
        motivation: "Every small step towards better health counts!"
      };
    }
  }

  /**
   * Store processed data in Weaviate (when connection is available)
   */
  async storeInWeaviate(processedData, originalData) {
    // This will be implemented when Weaviate connection is working
    console.log('📝 Would store in Weaviate:', {
      processedData,
      originalData
    });
    
    return {
      success: true,
      message: 'Data prepared for Weaviate storage',
      id: `temp-${Date.now()}`
    };
  }
}

module.exports = { structuredAIService: new StructuredAIService() };
