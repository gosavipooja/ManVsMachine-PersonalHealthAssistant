const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { weaviateService } = require('../services/persistent-storage');
const { aiCoach } = require('../services/mock-openai');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation schemas
const logEntrySchema = Joi.object({
  habitId: Joi.string().required(),
  value: Joi.number().min(0).required(),
  unit: Joi.string().min(1).max(50).required(),
  notes: Joi.string().max(500).optional(),
  method: Joi.string().valid('text', 'voice', 'photo').required(),
  metadata: Joi.object({
    foodItems: Joi.array().items(Joi.string()).optional(),
    calories: Joi.number().min(0).optional(),
    imageUrl: Joi.string().uri().optional(),
    voiceTranscript: Joi.string().optional()
  }).optional()
});

// Log activity entry
router.post('/', async (req, res) => {
  try {
    const { error, value } = logEntrySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const logEntry = {
      id: uuidv4(),
      ...value,
      timestamp: new Date()
    };

    // Store in Weaviate
    await weaviateService.addDocument({
      id: logEntry.id,
      content: `Activity log: ${logEntry.habitId} - ${logEntry.value} ${logEntry.unit}${logEntry.notes ? ` (${logEntry.notes})` : ''}`,
      metadata: {
        type: 'log',
        habitId: logEntry.habitId,
        userId: req.body.userId,
        timestamp: logEntry.timestamp.toISOString(),
        ...logEntry
      }
    });

    res.json({
      success: true,
      data: logEntry,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity',
      message: error.message
    });
  }
});

// Handle photo upload and food recognition
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo provided',
        message: 'Please upload a photo'
      });
    }

    // For hackathon demo, we'll simulate food recognition
    // In production, you'd integrate with Google Vision API or similar
    const mockFoodRecognition = {
      foodItems: ['Pizza', 'Salad', 'Apple'],
      calories: 450,
      confidence: 0.85
    };

    const logEntry = {
      id: uuidv4(),
      habitId: req.body.habitId || 'nutrition',
      value: mockFoodRecognition.calories,
      unit: 'calories',
      method: 'photo',
      notes: `Recognized: ${mockFoodRecognition.foodItems.join(', ')}`,
      metadata: {
        foodItems: mockFoodRecognition.foodItems,
        calories: mockFoodRecognition.calories,
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        confidence: mockFoodRecognition.confidence
      },
      timestamp: new Date()
    };

    // Store in Weaviate
    await weaviateService.addDocument({
      id: logEntry.id,
      content: `Photo log: ${logEntry.habitId} - ${logEntry.value} ${logEntry.unit} (${logEntry.notes})`,
      metadata: {
        type: 'log',
        habitId: logEntry.habitId,
        userId: req.body.userId,
        timestamp: logEntry.timestamp.toISOString(),
        ...logEntry
      }
    });

    res.json({
      success: true,
      data: logEntry,
      message: 'Photo processed and logged successfully'
    });
  } catch (error) {
    console.error('Photo processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process photo',
      message: error.message
    });
  }
});

// Get user's log history
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, habitId, startDate, endDate } = req.query;
    
    let whereCondition = {
      path: ['userId'],
      operator: 'Equal',
      valueText: userId
    };

    if (habitId) {
      whereCondition = {
        operator: 'And',
        operands: [
          {
            path: ['userId'],
            operator: 'Equal',
            valueText: userId
          },
          {
            path: ['habitId'],
            operator: 'Equal',
            valueText: habitId
          }
        ]
      };
    }

    const documents = await weaviateService.searchSimilar('', parseInt(limit), whereCondition);
    const logs = documents.map(doc => doc.metadata);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Log retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
      message: error.message
    });
  }
});

// Get today's logs
router.get('/:userId/today', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const documents = await weaviateService.getDocumentsByType('log', userId, 100);
    const todayLogs = documents
      .map(doc => doc.metadata)
      .filter(log => log.timestamp.startsWith(today));

    res.json({
      success: true,
      data: todayLogs
    });
  } catch (error) {
    console.error('Today logs retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve today\'s logs',
      message: error.message
    });
  }
});

// Delete log entry
router.delete('/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    
    await weaviateService.deleteDocument(logId);

    res.json({
      success: true,
      message: 'Log entry deleted successfully'
    });
  } catch (error) {
    console.error('Log deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete log entry',
      message: error.message
    });
  }
});

module.exports = router;
