const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/mock-openai');

const router = express.Router();

// Main AI coaching endpoint for frontend
router.post('/coaching', async (req, res) => {
  try {
    const { profile, todayLogs, history = [], context = {} } = req.body;
    
    // Validate required fields
    if (!profile || !todayLogs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile and todayLogs are required'
      });
    }

    // Get coaching insights
    const coachingResponse = await aiCoach.getCoachingInsights({
      profile,
      todayLogs,
      history,
      context
    });

    // Store coaching session in Weaviate
    const sessionId = uuidv4();
    await weaviateService.addDocument({
      id: sessionId,
      content: `Coaching session: ${coachingResponse.motivation_message}`,
      metadata: {
        type: 'coaching',
        userId: profile.id,
        timestamp: new Date().toISOString(),
        coachingType: 'comprehensive',
        content: coachingResponse,
        sessionId: sessionId
      }
    });

    res.json({
      success: true,
      data: coachingResponse,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('AI coaching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate coaching insights',
      message: error.message
    });
  }
});

// Quick motivation endpoint
router.post('/motivation', async (req, res) => {
  try {
    const { profile, todayLogs, history = [], context = {} } = req.body;
    
    if (!profile || !todayLogs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile and todayLogs are required'
      });
    }

    const motivation = await aiCoach.generateDailyMotivation(
      profile, 
      todayLogs, 
      history, 
      context
    );

    res.json({
      success: true,
      data: {
        motivation_message: motivation,
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

// Nutrition suggestions endpoint
router.post('/nutrition', async (req, res) => {
  try {
    const { profile, foodLogs, context = {} } = req.body;
    
    if (!profile || !foodLogs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile and foodLogs are required'
      });
    }

    const suggestions = await aiCoach.generateNutritionSuggestions(
      profile, 
      foodLogs, 
      context
    );

    res.json({
      success: true,
      data: {
        suggestions: suggestions,
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

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { profile, logs, message, context = {} } = req.body;
    
    if (!profile || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile and message are required'
      });
    }

    const response = await aiCoach.generateCoachingResponse(
      profile, 
      logs || [], 
      message, 
      context
    );

    // Store chat messages
    const userMessageId = uuidv4();
    const aiResponseId = uuidv4();

    await Promise.all([
      weaviateService.addDocument({
        id: userMessageId,
        content: `User message: ${message}`,
        metadata: {
          type: 'chat',
          userId: profile.id,
          timestamp: new Date().toISOString(),
          role: 'user',
          content: message
        }
      }),
      weaviateService.addDocument({
        id: aiResponseId,
        content: `AI response: ${response}`,
        metadata: {
          type: 'chat',
          userId: profile.id,
          timestamp: new Date().toISOString(),
          role: 'assistant',
          content: response
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        userMessage: {
          id: userMessageId,
          role: 'user',
          content: message,
          timestamp: new Date()
        },
        aiResponse: {
          id: aiResponseId,
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

// Cultural insights endpoint
router.post('/cultural-insights', async (req, res) => {
  try {
    const { profile, logs } = req.body;
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile is required'
      });
    }

    const culturalNotes = await aiCoach.generateCulturalInsights(profile, logs || []);

    res.json({
      success: true,
      data: {
        cultural_notes: culturalNotes,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Cultural insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cultural insights',
      message: error.message
    });
  }
});

// Health tips endpoint
router.post('/health-tips', async (req, res) => {
  try {
    const { profile, logs, context = {} } = req.body;
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Profile is required'
      });
    }

    const healthTips = await aiCoach.generateHealthTips(profile, logs || [], context);

    res.json({
      success: true,
      data: {
        health_tips: healthTips,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Health tips error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health tips',
      message: error.message
    });
  }
});

// Get coaching history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, type = 'all' } = req.query;
    
    let documents;
    if (type === 'coaching') {
      documents = await weaviateService.getCoachingHistory(userId, parseInt(limit));
    } else if (type === 'chat') {
      documents = await weaviateService.getDocumentsByType('chat', userId, parseInt(limit));
    } else {
      // Get both coaching and chat
      const [coachingDocs, chatDocs] = await Promise.all([
        weaviateService.getCoachingHistory(userId, parseInt(limit) / 2),
        weaviateService.getDocumentsByType('chat', userId, parseInt(limit) / 2)
      ]);
      documents = [...coachingDocs, ...chatDocs];
    }

    const history = documents
      .map(doc => doc.metadata)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve history',
      message: error.message
    });
  }
});

// Test endpoint for prompt engineering
router.post('/test-prompt', async (req, res) => {
  try {
    const { promptType, profile, logs, context = {} } = req.body;
    
    if (!promptType || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'promptType and profile are required'
      });
    }

    let result;
    switch (promptType) {
      case 'motivation':
        result = await aiCoach.generateDailyMotivation(profile, logs || [], [], context);
        break;
      case 'nutrition':
        result = await aiCoach.generateNutritionSuggestions(profile, logs || [], context);
        break;
      case 'chat':
        result = await aiCoach.generateCoachingResponse(profile, logs || [], context.message || 'Hello', context);
        break;
      case 'insights':
        result = await aiCoach.generateComprehensiveInsights(profile, logs || []);
        break;
      case 'cultural':
        result = await aiCoach.generateCulturalInsights(profile, logs || []);
        break;
      case 'health-tips':
        result = await aiCoach.generateHealthTips(profile, logs || [], context);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt type',
          message: 'Valid types: motivation, nutrition, chat, insights, cultural, health-tips'
        });
    }

    res.json({
      success: true,
      data: {
        promptType,
        result,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Prompt test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test prompt',
      message: error.message
    });
  }
});

module.exports = router;
