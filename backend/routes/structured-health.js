const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { structuredAIService } = require('../services/structured-ai');
const { weaviateService } = require('../services/persistent-storage');

const router = express.Router();

// Validation schema for structured health data
const structuredHealthSchema = Joi.object({
  food: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.string().required(),
      unit: Joi.string().required()
    })
  ).optional(),
  exercise: Joi.array().items(
    Joi.object({
      activity: Joi.string().required(),
      duration_min: Joi.number().optional(),
      distance_miles: Joi.number().optional()
    })
  ).optional(),
  meta: Joi.object({
    file_id: Joi.string().optional(),
    user_id: Joi.string().required(),
    confidence: Joi.object({
      food: Joi.number().min(0).max(1).optional(),
      exercise: Joi.number().min(0).max(1).optional()
    }).optional()
  }).required()
});

/**
 * POST /api/structured-health/process
 * Process structured health data and generate AI insights
 */
router.post('/process', async (req, res) => {
  try {
    console.log('📥 Received structured health data:', JSON.stringify(req.body, null, 2));

    // Validate input
    const { error, value } = structuredHealthSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { food, exercise, meta } = value;

    // Get user profile if available
    let userProfile = null;
    try {
      const profileDocs = await weaviateService.getDocumentsByType('profile', meta.user_id, 1);
      if (profileDocs.length > 0) {
        userProfile = profileDocs[0].metadata;
      }
    } catch (profileError) {
      console.log('⚠️  Could not fetch user profile:', profileError.message);
    }

    // Process with AI service
    const aiInsights = await structuredAIService.processHealthData(
      { food, exercise, meta },
      userProfile
    );

    if (!aiInsights.success) {
      return res.status(500).json({
        success: false,
        error: 'AI processing failed',
        message: aiInsights.error
      });
    }

    // Store the processed data
    const logEntry = {
      id: uuidv4(),
      userId: meta.user_id,
      timestamp: new Date().toISOString(),
      type: 'structured_health',
      data: {
        original: { food, exercise, meta },
        aiInsights: aiInsights.data
      }
    };

    // Store in persistent storage
    await weaviateService.addDocument({
      id: logEntry.id,
      content: `Structured health data processed: ${food?.length || 0} food items, ${exercise?.length || 0} exercise activities`,
      metadata: {
        type: 'structured_health',
        userId: meta.user_id,
        timestamp: new Date().toISOString(),
        ...logEntry
      }
    });

    // Store individual food items
    if (food && food.length > 0) {
      for (const foodItem of food) {
        const foodLogId = uuidv4();
        await weaviateService.addDocument({
          id: foodLogId,
          content: `Food: ${foodItem.quantity} ${foodItem.unit} of ${foodItem.name}`,
          metadata: {
            type: 'food',
            userId: meta.user_id,
            timestamp: new Date().toISOString(),
            habitId: 'nutrition',
            value: foodItem.quantity,
            unit: foodItem.unit,
            notes: foodItem.name,
            method: 'structured',
            confidence: meta.confidence?.food || 1.0
          }
        });
      }
    }

    // Store individual exercise items
    if (exercise && exercise.length > 0) {
      for (const exerciseItem of exercise) {
        const exerciseLogId = uuidv4();
        await weaviateService.addDocument({
          id: exerciseLogId,
          content: `Exercise: ${exerciseItem.activity}${exerciseItem.duration_min ? ` for ${exerciseItem.duration_min} minutes` : ''}${exerciseItem.distance_miles ? ` (${exerciseItem.distance_miles} miles)` : ''}`,
          metadata: {
            type: 'exercise',
            userId: meta.user_id,
            timestamp: new Date().toISOString(),
            habitId: 'exercise',
            value: exerciseItem.duration_min || 0,
            unit: 'minutes',
            notes: `${exerciseItem.activity}${exerciseItem.distance_miles ? ` - ${exerciseItem.distance_miles} miles` : ''}`,
            method: 'structured',
            confidence: meta.confidence?.exercise || 1.0
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        logId: logEntry.id,
        aiInsights: aiInsights.data,
        storedItems: {
          food: food?.length || 0,
          exercise: exercise?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error processing structured health data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/structured-health/history/:userId
 * Get structured health data history for a user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const documents = await weaviateService.getDocumentsByType('structured_health', userId, parseInt(limit));
    const history = documents.map(doc => doc.metadata);

    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching structured health history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/structured-health/insights/:userId
 * Get AI insights summary for a user
 */
router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    // Get recent structured health data
    const documents = await weaviateService.getDocumentsByType('structured_health', userId, 50);
    const recentData = documents
      .filter(doc => {
        const docDate = new Date(doc.timestamp);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        return docDate >= cutoffDate;
      });

    // Aggregate insights
    const aggregatedInsights = {
      totalFoodItems: 0,
      totalExerciseActivities: 0,
      averageConfidence: { food: 0, exercise: 0 },
      recentInsights: recentData.map(item => item.metadata?.data?.aiInsights).filter(Boolean)
    };

    recentData.forEach(item => {
      const original = item.metadata?.data?.original;
      if (original?.food) aggregatedInsights.totalFoodItems += original.food.length;
      if (original?.exercise) aggregatedInsights.totalExerciseActivities += original.exercise.length;
      
      if (original?.meta?.confidence) {
        if (original.meta.confidence.food) {
          aggregatedInsights.averageConfidence.food += original.meta.confidence.food;
        }
        if (original.meta.confidence.exercise) {
          aggregatedInsights.averageConfidence.exercise += original.meta.confidence.exercise;
        }
      }
    });

    // Calculate averages
    const dataCount = recentData.length;
    if (dataCount > 0) {
      aggregatedInsights.averageConfidence.food /= dataCount;
      aggregatedInsights.averageConfidence.exercise /= dataCount;
    }

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        summary: aggregatedInsights,
        recentData: recentData.slice(0, 10) // Last 10 entries
      }
    });

  } catch (error) {
    console.error('❌ Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
