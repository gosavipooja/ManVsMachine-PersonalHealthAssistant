const express = require('express');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/openai');
const { embeddingsService } = require('../services/embeddings');
const { vectorDB } = require('../services/vector-db');

const router = express.Router();

// GET /insights - Retrieve personalized health insights for a user
router.get('/', async (req, res) => {
  try {
    const { userId, days = 1, includeRecommendations = true } = req.query;
    
    // Validate required parameters
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'userId is required as a query parameter'
      });
    }

    // Get user profile
    const profileDocs = await weaviateService.getDocumentsByType('profile', userId, 1);
    if (profileDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'No profile found for this user'
      });
    }

    const profile = profileDocs[0].metadata;
    
    // Get recent logs based on days parameter
    const logDocs = await weaviateService.getDocumentsByType('log', userId, parseInt(days) * 2);
    const logs = logDocs.map(doc => doc.metadata);

    // Vector database integration for advanced insights
    console.log('🔍 Using vector database for enhanced insights...');
    
    // 1. Find similar users with comparable profiles and successful outcomes
    const similarUsers = await embeddingsService.findSimilarUsersForInsights(profile);
    
    // 2. Get relevant recommendations based on user profile and patterns
    const relevantRecommendations = await embeddingsService.findRelevantRecommendations(profile, logs);
    
    // 3. Analyze user patterns and trends
    const userPatterns = await embeddingsService.analyzeUserPatterns(userId, parseInt(days));
    
    // 4. Find similar successful patterns from other users
    const similarPatterns = await vectorDB.searchSimilar(
      `successful health patterns for ${profile.bodyType} body type ${profile.culture} culture ${profile.goals.join(' ')}`,
      {
        limit: 3,
        threshold: 0.7,
        where: { type: 'pattern' }
      }
    );

    // 5. Get user's personal context from vector database for personalized insights
    const userContext = await embeddingsService.getUserContextForPrompts(userId, profile, logs, parseInt(days));

    // Generate comprehensive insights using AI coach with user context
    const aiInsights = await aiCoach.generateComprehensiveInsights(profile, logs, userContext);

    // Generate AI-powered summary based on user's recent activity and profile with context
    const summary = await aiCoach.generatePersonalizedSummary(profile, logs, parseInt(days), userContext);
    
    // Prepare insights response with AI-generated content and vector database insights
    const insights = {
      summary: summary || generateDailySummary(profile, logs, parseInt(days)),
      motivation: aiInsights.motivationMessage,
      suggestions: aiInsights.suggestions,
      keyInsights: aiInsights.insights,
      progressSummary: aiInsights.progressSummary,
      nextSteps: aiInsights.nextSteps,
      // Vector database insights
      similarUsers: similarUsers,
      relevantRecommendations: relevantRecommendations,
      userPatterns: userPatterns,
      similarPatterns: similarPatterns
    };

    // Add dinner recommendation if requested
    if (includeRecommendations === 'true') {
      insights.dinnerRecommendation = await aiCoach.generateDinnerRecommendation(profile, logs);
    }

    // Save AI responses to vector database for learning
    console.log('💾 Saving AI responses to vector database...');
    try {
      await embeddingsService.saveInsightsResponse(insights, profile, logs, parseInt(days));
    } catch (error) {
      console.error('Warning: Failed to save AI responses to vector database:', error.message);
    }

    // Prepare metadata for response
    const metadata = {
      userId: userId,
      analysisTimeframe: `${days} ${days === 1 ? 'day' : 'days'}`,
      generatedAt: new Date().toISOString(),
      personalizationFactors: {
        bodyType: profile.bodyType,
        culture: profile.culture,
        goals: profile.goals,
        activityLevel: profile.activity_level,
        age: profile.age,
        gender: profile.gender
      },
      dataPoints: {
        totalLogs: logs.length,
        logTypes: [...new Set(logs.map(log => log.input_method))],
        timeRange: logs.length > 0 ? {
          earliest: logs[logs.length - 1]?.timestamp,
          latest: logs[0]?.timestamp
        } : null
      },
      userContext: {
        totalInteractions: userContext.totalInteractions,
        lastInteraction: userContext.lastInteraction,
        hasHistory: userContext.totalInteractions > 0
      }
    };

    res.json({
      success: true,
      data: insights,
      metadata: metadata
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

// Helper function to generate daily summary
function generateDailySummary(profile, logs, days) {
  const timeframe = days === 1 ? 'today' : `the past ${days} days`;
  const logCount = logs.length;
  
  if (logCount === 0) {
    return `No activity logged for ${timeframe}. Consider starting your health journey by logging your meals, exercise, or wellness activities.`;
  }

  const activities = [];
  const hasText = logs.some(log => log.input_method === 'text');
  const hasPhoto = logs.some(log => log.input_method === 'photo');
  const hasVoice = logs.some(log => log.input_method === 'voice');

  if (hasText) activities.push('text entries');
  if (hasPhoto) activities.push('photos');
  if (hasVoice) activities.push('voice notes');

  const activityText = activities.length > 1
    ? activities.slice(0, -1).join(', ') + ' and ' + activities[activities.length - 1]
    : activities[0] || 'activities';

  const goalText = profile.goals.length > 0
    ? ` Your focus on ${profile.goals.join(', ')} is showing great commitment.`
    : '';

  return `You've logged ${logCount} ${logCount === 1 ? 'entry' : 'entries'} ${timeframe} using ${activityText}.${goalText} Keep up the consistent tracking to build healthy habits!`;
}

// Helper function to generate dinner recommendation
function generateDinnerRecommendation(profile, logs) {
  const { bodyType, culture, goals } = profile;
  
  // Base recommendations by body type
  const bodyTypeRecommendations = {
    lean: 'lean proteins with complex carbohydrates',
    athletic: 'balanced proteins and healthy fats',
    rounded: 'lighter proteins with plenty of vegetables',
    ectomorph: 'calorie-dense foods with healthy fats',
    mesomorph: 'balanced macronutrients with moderate portions',
    endomorph: 'lean proteins with low-glycemic vegetables'
  };

  // Cultural considerations
  const culturalTwists = {
    asian: 'Consider steamed fish with brown rice and vegetables',
    indian: 'Try dal with quinoa and roasted vegetables',
    western: 'A grilled chicken salad with mixed greens would be perfect',
    african: 'Consider lean meat with sweet potato and leafy greens',
    european: 'A Mediterranean-style meal with olive oil and herbs',
    mediterranean: 'Grilled fish with olive oil, herbs, and seasonal vegetables'
  };

  const baseFood = bodyTypeRecommendations[bodyType] || 'balanced proteins and vegetables';
  const culturalSuggestion = culturalTwists[culture] || `Try incorporating ${baseFood} into your meal`;

  // Goal-specific additions
  let goalAddition = '';
  if (goals.includes('lose weight')) {
    goalAddition = ' Focus on portion control and include plenty of fiber-rich vegetables.';
  } else if (goals.includes('gain weight') || goals.includes('build muscle')) {
    goalAddition = ' Add healthy fats like avocado or nuts to increase calories.';
  } else if (goals.includes('improve health')) {
    goalAddition = ' Include colorful vegetables for maximum nutrient density.';
  }

  return `${culturalSuggestion}.${goalAddition}`;
}

// POST /insights/initialize - Initialize vector database with existing data
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Initializing vector database...');
    
    const result = await embeddingsService.indexExistingData();
    
    res.json({
      success: true,
      message: 'Vector database initialized successfully',
      data: result
    });
  } catch (error) {
    console.error('Vector database initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize vector database',
      message: error.message
    });
  }
});

// GET /insights/stats - Get vector database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await embeddingsService.getVectorStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting vector stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vector database statistics',
      message: error.message
    });
  }
});

// GET /insights/responses/search - Search for similar AI responses
router.get('/responses/search', async (req, res) => {
  try {
    const { query, userId, responseType, limit = 5, threshold = 0.7 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'query is required as a query parameter'
      });
    }

    const results = await embeddingsService.findSimilarResponses(query, {
      limit: parseInt(limit),
      threshold: parseFloat(threshold),
      responseType: responseType || null,
      userId: userId || null
    });

    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });
  } catch (error) {
    console.error('Error searching AI responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search AI responses',
      message: error.message
    });
  }
});

// GET /insights/responses/history/:userId - Get AI response history for a user
router.get('/responses/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { responseType, limit = 10 } = req.query;
    
    const history = await embeddingsService.getResponseHistory(userId, {
      limit: parseInt(limit),
      responseType: responseType || null
    });

    res.json({
      success: true,
      data: {
        userId,
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Error getting AI response history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response history',
      message: error.message
    });
  }
});

module.exports = router;