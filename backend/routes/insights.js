const express = require('express');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/openai');

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

    // TODO: Implement vector database integration for advanced insights
    // This is where we would:
    // 1. Query vector database for similar user patterns and behaviors
    // 2. Retrieve embeddings of user's health data and goals
    // 3. Find similar users with comparable profiles and successful outcomes
    // 4. Extract insights from successful user journeys and patterns
    // 5. Use semantic search to find relevant health recommendations
    // 6. Analyze trends and correlations in user's historical data
    // 
    // Example vector DB operations:
    // - vectorDB.findSimilarUsers(profile, { limit: 10, threshold: 0.8 })
    // - vectorDB.searchHealthPatterns(logs, profile.goals)
    // - vectorDB.getRecommendations(profile, logs, { type: 'nutrition', 'exercise', 'lifestyle' })
    // - vectorDB.analyzeTrends(userId, { timeframe: days, categories: ['all'] })

    // Generate comprehensive insights using AI coach
    const aiInsights = await aiCoach.generateComprehensiveInsights(profile, logs);

    // Generate AI-powered summary based on user's recent activity and profile
    const summary = await aiCoach.generatePersonalizedSummary(profile, logs, parseInt(days));
    
    // Prepare insights response with AI-generated content
    const insights = {
      summary: summary || generateDailySummary(profile, logs, parseInt(days)),
      motivation: aiInsights.motivationMessage,
      suggestions: aiInsights.suggestions,
      keyInsights: aiInsights.insights,
      progressSummary: aiInsights.progressSummary,
      nextSteps: aiInsights.nextSteps
    };

    // Add dinner recommendation if requested
    if (includeRecommendations === 'true') {
      insights.dinnerRecommendation = await aiCoach.generateDinnerRecommendation(profile, logs);
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

module.exports = router;