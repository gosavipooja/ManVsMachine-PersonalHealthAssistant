const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { weaviateService } = require('../services/memory-storage');
const { aiCoach } = require('../services/mock-openai');

const router = express.Router();

// Send message to AI coach
router.post('/:userId/message', async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message required',
        message: 'Please provide a message'
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
    
    // Get recent logs for context
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 20);
    const logs = logDocs.map(doc => doc.metadata);

    // Generate AI response
    const aiResponseData = await aiCoach.generateChatResponse(message, profile, logs);
    const aiResponse = aiResponseData.response;

    // Store both user message and AI response
    const userMessageId = uuidv4();
    const aiResponseId = uuidv4();

    await Promise.all([
      weaviateService.addDocument({
        id: userMessageId,
        content: `User message: ${message}`,
        metadata: {
          type: 'chat',
          userId: userId,
          timestamp: new Date().toISOString(),
          role: 'user',
          content: message
        }
      }),
      weaviateService.addDocument({
        id: aiResponseId,
        content: `AI response: ${aiResponse}`,
        metadata: {
          type: 'chat',
          userId: userId,
          timestamp: new Date().toISOString(),
          role: 'assistant',
          content: aiResponse
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
          content: aiResponse,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Get chat history
router.get('/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const documents = await weaviateService.getDocumentsByType('chat', userId, parseInt(limit));
    const messages = documents
      .map(doc => doc.metadata)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history',
      message: error.message
    });
  }
});

// Get quick suggestions based on current context
router.get('/:userId/suggestions', async (req, res) => {
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

    // Generate contextual suggestions
    const suggestions = await generateContextualSuggestions(profile, todayLogs);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: error.message
    });
  }
});

// Helper function to generate contextual suggestions
async function generateContextualSuggestions(profile, todayLogs) {
  const suggestions = [];
  const currentHour = new Date().getHours();
  
  // Time-based suggestions
  if (currentHour >= 6 && currentHour < 10) {
    suggestions.push({
      type: 'morning',
      message: 'Good morning! Ready to start your day with healthy habits?',
      actions: [
        'Log your morning hydration',
        'Plan your meals for the day',
        'Set a 5-minute mindfulness goal'
      ]
    });
  } else if (currentHour >= 10 && currentHour < 14) {
    suggestions.push({
      type: 'midday',
      message: 'How\'s your day going? Time for a wellness check-in!',
      actions: [
        'Log your lunch nutrition',
        'Take a 10-minute walk',
        'Check your hydration progress'
      ]
    });
  } else if (currentHour >= 14 && currentHour < 18) {
    suggestions.push({
      type: 'afternoon',
      message: 'Afternoon energy dip? Let\'s boost it with healthy habits!',
      actions: [
        'Log a healthy snack',
        'Do 5 minutes of stretching',
        'Take a mindful break'
      ]
    });
  } else if (currentHour >= 18 && currentHour < 22) {
    suggestions.push({
      type: 'evening',
      message: 'Wind down with some evening wellness habits!',
      actions: [
        'Log your dinner nutrition',
        'Reflect on today\'s progress',
        'Prepare for tomorrow\'s goals'
      ]
    });
  } else {
    suggestions.push({
      type: 'night',
      message: 'Time to rest and recharge for tomorrow!',
      actions: [
        'Log your sleep preparation',
        'Review today\'s achievements',
        'Set tomorrow\'s intentions'
      ]
    });
  }
  
  // Progress-based suggestions
  const hydrationLogs = todayLogs.filter(log => log.habitId === 'hydration');
  const hydrationTotal = hydrationLogs.reduce((sum, log) => sum + log.value, 0);
  
  if (hydrationTotal < 4) {
    suggestions.push({
      type: 'hydration',
      message: 'Stay hydrated! You\'ve had ' + hydrationTotal + ' glasses today.',
      actions: ['Log a glass of water', 'Set a hydration reminder']
    });
  }
  
  const nutritionLogs = todayLogs.filter(log => log.habitId === 'nutrition');
  if (nutritionLogs.length === 0) {
    suggestions.push({
      type: 'nutrition',
      message: 'Don\'t forget to log your meals for better nutrition tracking!',
      actions: ['Log breakfast', 'Log lunch', 'Log dinner']
    });
  }
  
  return suggestions;
}

module.exports = router;
