const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/mock-openai');

const router = express.Router();

// Get daily motivation
router.get('/:userId/motivation', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    
    // Get today's logs
    const today = new Date().toISOString().split('T')[0];
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 100);
    const todayLogs = logDocs
      .map(doc => doc.metadata)
      .filter(log => log.timestamp.startsWith(today));

    // Get recent history (last 7 days)
    const recentLogs = logDocs
      .map(doc => doc.metadata)
      .slice(0, 20);

    // Generate motivation
    const motivation = await aiCoach.generateMotivation(profile, recentLogs);

    // Store coaching response
    const coachingId = uuidv4();
    await weaviateService.addDocument({
      id: coachingId,
      content: `Daily motivation: ${motivation}`,
      metadata: {
        type: 'coaching',
        userId: userId,
        timestamp: new Date().toISOString(),
        coachingType: 'motivation',
        content: motivation
      }
    });

    res.json({
      success: true,
      data: {
        motivation,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Motivation generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate motivation',
      message: error.message
    });
  }
});

// Get nutrition suggestions
router.get('/:userId/nutrition', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    
    // Get recent food logs
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 20);
    const foodLogs = logDocs
      .map(doc => doc.metadata)
      .filter(log => log.habitId === 'nutrition' || (log.metadata && log.metadata.foodItems));

    // Generate nutrition suggestions
    const suggestions = await aiCoach.generateNutritionSuggestions(profile, foodLogs);

    res.json({
      success: true,
      data: {
        suggestions,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Nutrition suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nutrition suggestions',
      message: error.message
    });
  }
});

// Get comprehensive insights
router.get('/:userId/insights', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    
    // Get recent logs
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 50);
    const logs = logDocs.map(doc => doc.metadata);

    // Generate comprehensive insights
    const insights = await aiCoach.generateComprehensiveInsights(profile, logs);

    // Store coaching response
    const coachingId = uuidv4();
    await weaviateService.addDocument({
      id: coachingId,
      content: `Comprehensive insights: ${JSON.stringify(insights)}`,
      metadata: {
        type: 'coaching',
        userId: userId,
        timestamp: new Date().toISOString(),
        coachingType: 'insights',
        content: insights
      }
    });

    res.json({
      success: true,
      data: insights
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

// Get coaching history
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    const documents = await weaviateService.getCoachingHistory(userId, parseInt(limit));
    const history = documents.map(doc => doc.metadata);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Coaching history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve coaching history',
      message: error.message
    });
  }
});

module.exports = router;
