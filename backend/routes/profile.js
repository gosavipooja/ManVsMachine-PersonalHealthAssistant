const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/openai');

const router = express.Router();

// Validation schemas
const profileSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(13).max(120).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  height: Joi.number().min(100).max(250).required(),
  weight: Joi.number().min(30).max(300).required(),
  bodyType: Joi.string().valid(
    'lean',                // Lean body type
    'athletic',            // Athletic body type
    'rounded'              // Rounded body type
  ).required(),
  culture: Joi.string().valid(
    'asian',               // Asian cultural background
    'indian',              // Indian cultural background
    'western',             // Western cultural background
    'african',             // African cultural background
    'european',            // European cultural background
    'mediterranean'        // Mediterranean cultural background
  ).required(),
  goals: Joi.array().items(Joi.string().min(2).max(100)).min(1).max(10).required(),
  activity_level: Joi.string().valid(
    'very_light',          // Minimal physical activity
    'light',               // Light physical activity
    'moderate',            // Moderate physical activity
    'vigorous',            // Vigorous physical activity
    'very_hard',           // Very hard physical activity
    'max_effort'           // Maximum effort physical activity
  ).required()
});

// Create or update user profile
router.post('/', async (req, res) => {
  try {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const profileId = req.body.id || uuidv4();
    const profile = {
      id: profileId,
      ...value,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in Weaviate
    await weaviateService.addDocument({
      id: profileId,
      content: `User profile: ${profile.name}, ${profile.age} year old ${profile.gender}, ${profile.bodyType} body type, ${profile.activity_level} activity level, ${profile.culture} background, goals: ${profile.goals.join(', ')}`,
      metadata: {
        type: 'profile',
        userId: profileId,
        timestamp: new Date().toISOString(),
        ...profile
      }
    });

    res.json({
      success: true,
      data: profile,
      message: 'Profile created successfully'
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      message: error.message
    });
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const documents = await weaviateService.getDocumentsByType('profile', userId, 1);
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'No profile found for this user'
      });
    }

    const profile = documents[0].metadata;
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = profileSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const updatedProfile = {
      id: userId,
      ...value,
      updatedAt: new Date()
    };

    // Update in Weaviate
    await weaviateService.updateDocument(userId, {
      id: userId,
      content: `User profile: ${updatedProfile.name}, ${updatedProfile.age} year old ${updatedProfile.gender}, ${updatedProfile.bodyType} body type, ${updatedProfile.activity_level} activity level, ${updatedProfile.culture} background, goals: ${updatedProfile.goals.join(', ')}`,
      metadata: {
        type: 'profile',
        userId: userId,
        timestamp: new Date().toISOString(),
        ...updatedProfile
      }
    });

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Get personalized health insights
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
    const logDocs = await weaviateService.getDocumentsByType('log', userId, 10);
    const logs = logDocs.map(doc => doc.metadata);

    // Generate AI insights
    const insights = await aiCoach.generateComprehensiveInsights(profile, logs);

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

module.exports = router;
