const express = require('express');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/openai');

const router = express.Router();

// POST /api/chatbot/command - Process chatbot commands via REST API
router.post('/command', async (req, res) => {
  try {
    const { command, userId, text } = req.body;
    
    // Validate required parameters
    if (!command || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'command and userId are required'
      });
    }

    let result = {};

    switch (command.toLowerCase()) {
      case 'profile':
        result = await handleProfileCommand(userId);
        break;
      
      case 'log':
        if (!text) {
          return res.status(400).json({
            success: false,
            error: 'Missing text parameter',
            message: 'text parameter is required for log command'
          });
        }
        result = await handleLogCommand(userId, text);
        break;
      
      case 'insights':
        result = await handleInsightsCommand(userId);
        break;
      
      case 'recommend':
        result = await handleRecommendCommand(userId);
        break;
      
      case 'dinner':
        result = await handleDinnerCommand(userId);
        break;
      
      case 'stats':
        result = await handleStatsCommand(userId);
        break;
      
      case 'tips':
        result = handleTipsCommand();
        break;
      
      case 'help':
        result = handleHelpCommand();
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown command',
          message: `Command "${command}" is not recognized. Use "help" to see available commands.`
        });
    }

    res.json({
      success: true,
      command: command,
      userId: userId,
      data: result
    });

  } catch (error) {
    console.error('Chatbot command error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process command',
      message: error.message
    });
  }
});

// Handle profile command
async function handleProfileCommand(userId) {
  try {
    const profileDocs = await weaviateService.getDocumentsByType('profile', userId, 1);
    
    if (profileDocs.length > 0) {
      const profile = profileDocs[0].metadata;
      return {
        type: 'profile_display',
        profile: {
          name: profile.name || 'User',
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          bodyType: profile.bodyType,
          culture: profile.culture,
          activity_level: profile.activity_level,
          goals: profile.goals
        },
        message: 'Profile retrieved successfully'
      };
    } else {
      return {
        type: 'profile_missing',
        message: 'No profile found. Please create a profile first.',
        createProfileUrl: '/api/profile'
      };
    }
  } catch (error) {
    throw new Error('Failed to retrieve profile: ' + error.message);
  }
}

// Handle log command
async function handleLogCommand(userId, text) {
  try {
    const logEntry = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      input_method: 'text',
      content: text
    };

    // Store in persistent storage
    const logId = require('uuid').v4();
    await weaviateService.addDocument({
      id: logId,
      content: `Log entry: text - ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
      metadata: {
        type: 'log',
        userId: userId,
        timestamp: logEntry.timestamp,
        id: logId,
        user_id: userId,
        input_method: 'text',
        content_preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        created_at: new Date().toISOString()
      }
    });

    return {
      type: 'log_success',
      message: 'Activity logged successfully!',
      logEntry: {
        id: logId,
        content: text,
        timestamp: logEntry.timestamp
      }
    };
  } catch (error) {
    throw new Error('Failed to log activity: ' + error.message);
  }
}

// Handle insights command
async function handleInsightsCommand(userId) {
  try {
    // Get user profile
    const profileDocs = await weaviateService.getDocumentsByType('profile', userId, 1);
    if (profileDocs.length === 0) {
      return {
        type: 'profile_required',
        message: 'No profile found. Please create a profile first to get insights.'
      };
    }

    const profile = profileDocs[0].metadata;
    
    // Get recent logs
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 14);
    const logs = logDocs.map(doc => doc.metadata);

    // Generate AI insights
    const aiInsights = await aiCoach.generateComprehensiveInsights(profile, logs);
    const summary = await aiCoach.generatePersonalizedSummary(profile, logs, 7);
    const dinnerRecommendation = await aiCoach.generateDinnerRecommendation(profile, logs);

    return {
      type: 'insights',
      summary: summary || generateFallbackSummary(profile, logs),
      motivation: aiInsights.motivationMessage,
      suggestions: aiInsights.suggestions,
      keyInsights: aiInsights.insights,
      progressSummary: aiInsights.progressSummary,
      nextSteps: aiInsights.nextSteps,
      dinnerRecommendation: dinnerRecommendation,
      metadata: {
        analysisTimeframe: '7 days',
        totalLogs: logs.length,
        logTypes: [...new Set(logs.map(log => log.input_method))],
        personalizationFactors: {
          bodyType: profile.bodyType,
          culture: profile.culture,
          goals: profile.goals,
          activityLevel: profile.activity_level
        }
      }
    };
  } catch (error) {
    throw new Error('Failed to generate insights: ' + error.message);
  }
}

// Handle recommend command
async function handleRecommendCommand(userId) {
  try {
    const insights = await handleInsightsCommand(userId);
    
    if (insights.type === 'profile_required') {
      return insights;
    }

    return {
      type: 'recommendations',
      suggestions: insights.suggestions || [],
      keyInsights: insights.keyInsights || [],
      nextSteps: insights.nextSteps || [],
      message: 'AI-powered health recommendations based on your profile and activity'
    };
  } catch (error) {
    // Fallback recommendations
    return {
      type: 'recommendations_fallback',
      suggestions: [
        "Drink at least 8 glasses of water daily",
        "Take a 10-minute walk after meals",
        "Include colorful vegetables in every meal"
      ],
      message: 'Fallback recommendations (AI service unavailable)'
    };
  }
}

// Handle dinner command
async function handleDinnerCommand(userId) {
  try {
    const insights = await handleInsightsCommand(userId);
    
    if (insights.type === 'profile_required') {
      return insights;
    }

    return {
      type: 'dinner_recommendation',
      recommendation: insights.dinnerRecommendation || 'Try a balanced meal with lean protein, complex carbohydrates, and plenty of vegetables.',
      message: 'AI-powered dinner recommendation based on your profile and goals'
    };
  } catch (error) {
    return {
      type: 'dinner_fallback',
      recommendation: 'Try a balanced meal with lean protein, complex carbohydrates, and plenty of vegetables.',
      message: 'Fallback dinner suggestion (AI service unavailable)'
    };
  }
}

// Handle stats command
async function handleStatsCommand(userId) {
  try {
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 1000);
    const logs = logDocs.map(doc => doc.metadata);
    
    // Filter logs by date range (last 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    
    // Calculate statistics
    const stats = {
      total_logs: recentLogs.length,
      by_input_method: {
        text: recentLogs.filter(log => log.input_method === 'text').length,
        voice: recentLogs.filter(log => log.input_method === 'voice').length,
        photo: recentLogs.filter(log => log.input_method === 'photo').length
      },
      by_date: {}
    };
    
    // Group by date
    recentLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      stats.by_date[date] = (stats.by_date[date] || 0) + 1;
    });

    return {
      type: 'statistics',
      stats: stats,
      period: '30 days',
      message: 'Activity statistics for the last 30 days'
    };
  } catch (error) {
    throw new Error('Failed to retrieve statistics: ' + error.message);
  }
}

// Handle tips command
function handleTipsCommand() {
  const tips = [
    "Start your day with a glass of water",
    "Eat the rainbow - colorful fruits and vegetables",
    "Take the stairs instead of the elevator",
    "Practice mindful eating - chew slowly",
    "Create a phone-free bedroom for better sleep",
    "Try the 4-7-8 breathing technique for stress",
    "Replace one sugary drink with water daily",
    "Do desk exercises during work breaks",
    "Add herbs and spices instead of extra salt",
    "Practice gratitude - write down 3 good things daily"
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  return {
    type: 'health_tip',
    tip: randomTip,
    message: 'Random health tip for you'
  };
}

// Handle help command
function handleHelpCommand() {
  return {
    type: 'help',
    commands: [
      {
        command: 'profile',
        description: 'View/create your health profile',
        parameters: ['userId']
      },
      {
        command: 'log',
        description: 'Log a health activity',
        parameters: ['userId', 'text']
      },
      {
        command: 'insights',
        description: 'Get personalized health insights',
        parameters: ['userId']
      },
      {
        command: 'recommend',
        description: 'Get health recommendations',
        parameters: ['userId']
      },
      {
        command: 'dinner',
        description: 'Get AI-powered dinner recommendation',
        parameters: ['userId']
      },
      {
        command: 'stats',
        description: 'View your activity statistics',
        parameters: ['userId']
      },
      {
        command: 'tips',
        description: 'Get quick health tips',
        parameters: []
      },
      {
        command: 'help',
        description: 'Show available commands',
        parameters: []
      }
    ],
    message: 'Available chatbot commands'
  };
}

// Fallback summary generator
function generateFallbackSummary(profile, logs) {
  const logCount = logs.length;
  
  if (logCount === 0) {
    return 'No activity logged recently. Consider starting your health journey by logging your meals, exercise, or wellness activities.';
  }

  const goalText = profile.goals && profile.goals.length > 0
    ? ` Your focus on ${profile.goals.join(', ')} is showing great commitment.`
    : '';

  return `You've logged ${logCount} ${logCount === 1 ? 'entry' : 'entries'} recently.${goalText} Keep up the consistent tracking to build healthy habits!`;
}

module.exports = router;