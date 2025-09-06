const express = require('express');
const Joi = require('joi');
const { enhancedAIService } = require('../services/enhanced-ai');

const router = express.Router();

// Joi schema for proposed logs
const proposedLogSchema = Joi.object({
  type: Joi.string().valid('food', 'exercise').required(),
  user_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().optional(),
  source: Joi.string().optional(),
  provenance: Joi.object({
    input_file: Joi.string().optional(),
    transcript_confidence: Joi.number().min(0).max(1).optional(),
    parser_confidence: Joi.number().min(0).max(1).optional()
  }).optional(),
  // Food-specific fields
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().required(),
    unit: Joi.string().required(),
    macros: Joi.object({
      calories: Joi.number().optional(),
      carbs_g: Joi.number().optional(),
      protein_g: Joi.number().optional(),
      fat_g: Joi.number().optional()
    }).optional(),
    source_ref: Joi.object({
      provider: Joi.string().optional(),
      id: Joi.string().optional()
    }).optional()
  })).when('type', { is: 'food', then: Joi.required() }),
  // Exercise-specific fields
  activity: Joi.string().when('type', { is: 'exercise', then: Joi.required() }),
  duration_min: Joi.number().integer().min(0).when('type', { is: 'exercise', then: Joi.required() }),
  calories_burned: Joi.number().min(0).optional(),
  effort_level: Joi.string().valid('light', 'moderate', 'vigorous').optional(),
  distance_miles: Joi.number().min(0).optional()
});

const loggingSchema = Joi.object({
  proposed_logs: Joi.array().items(proposedLogSchema).min(1).required()
});

/**
 * POST /logging
 * Save food or exercise information to vector DB
 */
router.post('/logging', async (req, res) => {
  try {
    console.log('📥 Received logging request:', JSON.stringify(req.body, null, 2));

    // Validate input
    const { error, value } = loggingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    // Process logging data
    const result = await enhancedAIService.processLoggingData(value);

    res.json({
      success: true,
      message: 'Logging data saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in logging endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /get_recommendation
 * Get personalized dinner recommendation based on profile and historical data
 */
router.get('/get_recommendation', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id parameter'
      });
    }

    console.log('🍽️ Generating dinner recommendation for user:', user_id);

    // Generate dinner recommendation
    const result = await enhancedAIService.generateDinnerRecommendation(user_id);

    res.json({
      success: true,
      message: 'Dinner recommendation generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in get_recommendation endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /get_insight
 * Get daily summary and insights from vector DB
 */
router.get('/get_insight', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id parameter'
      });
    }

    console.log('📊 Generating daily insights for user:', user_id);

    // Generate daily insights
    const result = await enhancedAIService.generateDailyInsights(user_id);

    res.json({
      success: true,
      message: 'Daily insights generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in get_insight endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
