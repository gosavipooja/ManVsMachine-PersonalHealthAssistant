const express = require('express');
const { weaviateService } = require('../services/weaviate');
const { aiCoach } = require('../services/openai');

const router = express.Router();

// Spec-compliant endpoints matching DESIGN.md exactly

// POST /profile - Create user profile
router.post('/profile', async (req, res) => {
  try {
    const profile = req.body;
    
    // Validate required fields
    if (!profile.id || !profile.name || !profile.age || !profile.gender) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: id, name, age, gender'
      });
    }

    // Store in Weaviate
    await weaviateService.addDocument({
      id: profile.id,
      content: `User profile: ${profile.name}, ${profile.age} year old ${profile.gender}, ${profile.body_type || 'unknown'} body type, ${profile.culture || 'western'} background`,
      metadata: {
        type: 'profile',
        userId: profile.id,
        timestamp: new Date().toISOString(),
        ...profile
      }
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create profile'
    });
  }
});

// POST /log - Log habit entry
router.post('/log', async (req, res) => {
  try {
    const logEntry = req.body;
    
    // Validate required fields
    if (!logEntry.id || !logEntry.user_id || !logEntry.type || !logEntry.content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: id, user_id, type, content'
      });
    }

    // Store in Weaviate
    await weaviateService.addDocument({
      id: logEntry.id,
      content: `Habit log: ${logEntry.type} - ${logEntry.content}`,
      metadata: {
        type: 'log',
        userId: logEntry.user_id,
        timestamp: logEntry.timestamp || new Date().toISOString(),
        ...logEntry
      }
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Log creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create log entry'
    });
  }
});

// GET /history - Get user's log history
router.get('/history', async (req, res) => {
  try {
    const { user_id, date } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id is required'
      });
    }

    // Get logs from Weaviate
    const documents = await weaviateService.getDocumentsByType('log', user_id, 100);
    let logs = documents.map(doc => doc.metadata);

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date).toISOString().split('T')[0];
      logs = logs.filter(log => log.timestamp.startsWith(targetDate));
    }

    res.json(logs);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve history'
    });
  }
});

// POST /coach - Get AI coach feedback
router.post('/coach', async (req, res) => {
  try {
    const { user_id, date } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id is required'
      });
    }

    // Get user profile
    const profileDocs = await weaviateService.getDocumentsByType('profile', user_id, 1);
    if (profileDocs.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    const profile = profileDocs[0].metadata;
    
    // Get logs for the specified date or today
    const targetDate = date || new Date().toISOString().split('T')[0];
    const logDocs = await weaviateService.getDocumentsByType('log', user_id, 100);
    const todayLogs = logDocs
      .map(doc => doc.metadata)
      .filter(log => log.timestamp.startsWith(targetDate));

    // Get recent history for context
    const recentLogs = logDocs.map(doc => doc.metadata).slice(0, 20);

    // Generate AI feedback
    const coachingResponse = await aiCoach.getCoachingInsights({
      profile: {
        id: profile.id,
        age: profile.age,
        gender: profile.gender,
        height: profile.height_cm,
        weight: profile.weight_kg,
        bodyType: profile.body_type || 'mesomorph',
        culture: profile.culture || 'western',
        goals: profile.goals || ['improve health'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      todayLogs: todayLogs.map(log => ({
        id: log.id,
        habitId: log.type,
        value: 1, // Default value for spec compliance
        unit: 'entry',
        notes: log.content,
        method: log.input_method || 'text',
        timestamp: new Date(log.timestamp),
        metadata: {}
      })),
      history: recentLogs.map(log => ({
        id: log.id,
        habitId: log.type,
        value: 1,
        unit: 'entry',
        notes: log.content,
        method: log.input_method || 'text',
        timestamp: new Date(log.timestamp),
        metadata: {}
      }))
    });

    // Format response according to spec
    const aiFeedback = {
      user_id: user_id,
      date: targetDate,
      motivation_message: coachingResponse.motivation_message,
      suggestions: coachingResponse.suggestions
    };

    res.json(aiFeedback);
  } catch (error) {
    console.error('Coach feedback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate coach feedback'
    });
  }
});

// Additional endpoints for enhanced functionality

// GET /profile/:id - Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await weaviateService.getDocumentsByType('profile', id, 1);
    if (documents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.json(documents[0].metadata);
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
});

// PUT /profile/:id - Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get existing profile
    const documents = await weaviateService.getDocumentsByType('profile', id, 1);
    if (documents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    const existingProfile = documents[0].metadata;
    const updatedProfile = { ...existingProfile, ...updates };

    // Update in Weaviate
    await weaviateService.updateDocument(id, {
      id: id,
      content: `User profile: ${updatedProfile.name}, ${updatedProfile.age} year old ${updatedProfile.gender}, ${updatedProfile.body_type || 'unknown'} body type, ${updatedProfile.culture || 'western'} background`,
      metadata: {
        type: 'profile',
        userId: id,
        timestamp: new Date().toISOString(),
        ...updatedProfile
      }
    });

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;
