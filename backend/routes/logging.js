const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');
const { weaviateService } = require('../services/persistent-storage');

const router = express.Router();

// Create uploads directory structure
const uploadsDir = path.join(__dirname, '../uploads');
const textDir = path.join(uploadsDir, 'text');
const audioDir = path.join(uploadsDir, 'audio');
const imageDir = path.join(uploadsDir, 'images');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(textDir, { recursive: true });
    await fs.mkdir(audioDir, { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize directories
ensureDirectories();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files (.wav, .mp3, .m4a) and images (.png, .jpg, .jpeg)
    const allowedMimes = [
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/mpeg', 'audio/mp3',
      'audio/mp4', 'audio/m4a',
      'image/png', 'image/jpeg', 'image/jpg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only audio (.wav, .mp3, .m4a) and image (.png, .jpg, .jpeg) files are supported.`), false);
    }
  }
});

// Validation schemas
const textLogSchema = Joi.object({
  user_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  input_method: Joi.string().valid('text').required(),
  content: Joi.string().min(1).max(5000).required()
});

const fileLogSchema = Joi.object({
  user_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  input_method: Joi.string().valid('voice', 'photo').required()
});

const base64LogSchema = Joi.object({
  user_id: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  input_method: Joi.string().valid('voice', 'photo').required(),
  content: Joi.string().required(), // base64 encoded data
  file_type: Joi.string().valid('wav', 'mp3', 'm4a', 'png', 'jpg', 'jpeg').required()
});

// POST /api/logging - Create a new log entry
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const logId = uuidv4();
    const { user_id, timestamp, input_method, content } = req.body;
    
    let logEntry = {
      id: logId,
      user_id,
      timestamp,
      input_method,
      file_name: null,
      created_at: new Date().toISOString()
    };

    // Handle different input methods
    switch (input_method) {
      case 'text':
        // Validate text input
        const { error: textError } = textLogSchema.validate(req.body);
        if (textError) {
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: textError.details[0].message
          });
        }

        // Save text content to file
        const textFileName = `${logId}.txt`;
        const textFilePath = path.join(textDir, textFileName);
        await fs.writeFile(textFilePath, content, 'utf8');
        
        logEntry.file_name = textFileName;
        logEntry.content_preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        break;

      case 'voice':
        // Check if we have a file upload or base64 content
        if (req.file) {
          // Handle file upload
          const { error: voiceError } = fileLogSchema.validate(req.body);
          if (voiceError) {
            return res.status(400).json({
              success: false,
              error: 'Validation error',
              message: voiceError.details[0].message
            });
          }

          // Determine file extension based on mimetype
          let audioExt = '.wav';
          if (req.file.mimetype.includes('mp3')) audioExt = '.mp3';
          if (req.file.mimetype.includes('m4a')) audioExt = '.m4a';

          const audioFileName = `${logId}${audioExt}`;
          const audioFilePath = path.join(audioDir, audioFileName);
          await fs.writeFile(audioFilePath, req.file.buffer);
          
          logEntry.file_name = audioFileName;
          logEntry.file_size = req.file.size;
          logEntry.content_preview = `Audio recording (${(req.file.size / 1024).toFixed(1)} KB)`;
        } else if (req.body.content && req.body.file_type) {
          // Handle base64 content
          const { error: base64Error } = base64LogSchema.validate(req.body);
          if (base64Error) {
            return res.status(400).json({
              success: false,
              error: 'Validation error',
              message: base64Error.details[0].message
            });
          }

          try {
            // Decode base64 content
            const audioBuffer = Buffer.from(req.body.content, 'base64');
            const audioExt = `.${req.body.file_type}`;
            const audioFileName = `${logId}${audioExt}`;
            const audioFilePath = path.join(audioDir, audioFileName);
            
            await fs.writeFile(audioFilePath, audioBuffer);
            
            logEntry.file_name = audioFileName;
            logEntry.file_size = audioBuffer.length;
            logEntry.content_preview = `Audio recording (${(audioBuffer.length / 1024).toFixed(1)} KB)`;
          } catch (error) {
            return res.status(400).json({
              success: false,
              error: 'Invalid base64 content',
              message: 'Could not decode base64 audio data'
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            error: 'File or content required',
            message: 'Either upload a file or provide base64 content with file_type for voice input method'
          });
        }
        break;

      case 'photo':
        // Check if we have a file upload or base64 content
        if (req.file) {
          // Handle file upload
          const { error: photoError } = fileLogSchema.validate(req.body);
          if (photoError) {
            return res.status(400).json({
              success: false,
              error: 'Validation error',
              message: photoError.details[0].message
            });
          }

          // Determine file extension based on mimetype
          let imageExt = '.png';
          if (req.file.mimetype.includes('jpeg') || req.file.mimetype.includes('jpg')) {
            imageExt = '.jpg';
          }

          const imageFileName = `${logId}${imageExt}`;
          const imageFilePath = path.join(imageDir, imageFileName);
          await fs.writeFile(imageFilePath, req.file.buffer);
          
          logEntry.file_name = imageFileName;
          logEntry.file_size = req.file.size;
          logEntry.content_preview = `Image file (${(req.file.size / 1024).toFixed(1)} KB)`;
        } else if (req.body.content && req.body.file_type) {
          // Handle base64 content
          const { error: base64Error } = base64LogSchema.validate(req.body);
          if (base64Error) {
            return res.status(400).json({
              success: false,
              error: 'Validation error',
              message: base64Error.details[0].message
            });
          }

          try {
            // Decode base64 content
            const imageBuffer = Buffer.from(req.body.content, 'base64');
            const imageExt = `.${req.body.file_type}`;
            const imageFileName = `${logId}${imageExt}`;
            const imageFilePath = path.join(imageDir, imageFileName);
            
            await fs.writeFile(imageFilePath, imageBuffer);
            
            logEntry.file_name = imageFileName;
            logEntry.file_size = imageBuffer.length;
            logEntry.content_preview = `Image file (${(imageBuffer.length / 1024).toFixed(1)} KB)`;
          } catch (error) {
            return res.status(400).json({
              success: false,
              error: 'Invalid base64 content',
              message: 'Could not decode base64 image data'
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            error: 'File or content required',
            message: 'Either upload a file or provide base64 content with file_type for photo input method'
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid input method',
          message: 'input_method must be one of: text, voice, photo'
        });
    }

    // Store in persistent storage
    await weaviateService.addDocument({
      id: logId,
      content: `Log entry: ${input_method} - ${logEntry.content_preview}`,
      metadata: {
        type: 'log',
        userId: user_id,
        timestamp: timestamp,
        ...logEntry
      }
    });

    res.json({
      success: true,
      data: logEntry,
      message: 'Log entry created successfully'
    });

  } catch (error) {
    console.error('Logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create log entry',
      message: error.message
    });
  }
});

// GET /api/logging/:userId - Get user's log entries
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, input_method, start_date, end_date } = req.query;
    
    // Get logs from persistent storage
    const documents = await weaviateService.getDocumentsByType('log', userId, parseInt(limit));
    let logs = documents.map(doc => doc.metadata);

    // Filter by input method if specified
    if (input_method) {
      logs = logs.filter(log => log.input_method === input_method);
    }

    // Filter by date range if specified
    if (start_date || end_date) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (start_date && logDate < new Date(start_date)) return false;
        if (end_date && logDate > new Date(end_date)) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: logs,
      count: logs.length
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

// GET /api/logging/:userId/today - Get today's logs
router.get('/:userId/today', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const documents = await weaviateService.getDocumentsByType('log', userId, 100);
    const todayLogs = documents
      .map(doc => doc.metadata)
      .filter(log => log.timestamp.startsWith(today))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: todayLogs,
      count: todayLogs.length
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

// GET /api/logging/file/:logId - Download/view a log file
router.get('/file/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    
    // Get log entry from storage
    const logDoc = await weaviateService.getDocumentById(logId);
    if (!logDoc) {
      return res.status(404).json({
        success: false,
        error: 'Log not found',
        message: 'No log entry found with this ID'
      });
    }

    const logEntry = logDoc.metadata;
    const { input_method, file_name } = logEntry;

    if (!file_name) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'No file associated with this log entry'
      });
    }

    // Determine file path based on input method
    let filePath;
    let contentType;
    
    switch (input_method) {
      case 'text':
        filePath = path.join(textDir, file_name);
        contentType = 'text/plain';
        break;
      case 'voice':
        filePath = path.join(audioDir, file_name);
        if (file_name.endsWith('.wav')) contentType = 'audio/wav';
        else if (file_name.endsWith('.mp3')) contentType = 'audio/mpeg';
        else if (file_name.endsWith('.m4a')) contentType = 'audio/mp4';
        else contentType = 'audio/wav';
        break;
      case 'photo':
        filePath = path.join(imageDir, file_name);
        if (file_name.endsWith('.png')) contentType = 'image/png';
        else if (file_name.endsWith('.jpg') || file_name.endsWith('.jpeg')) contentType = 'image/jpeg';
        else contentType = 'image/png';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid input method',
          message: 'Unknown input method for file retrieval'
        });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'The associated file could not be found on disk'
      });
    }

    // Set appropriate headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);

  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file',
      message: error.message
    });
  }
});

// DELETE /api/logging/:logId - Delete a log entry and its associated file
router.delete('/:logId', async (req, res) => {
  try {
    const { logId } = req.params;
    
    // Get log entry from storage
    const logDoc = await weaviateService.getDocumentById(logId);
    if (!logDoc) {
      return res.status(404).json({
        success: false,
        error: 'Log not found',
        message: 'No log entry found with this ID'
      });
    }

    const logEntry = logDoc.metadata;
    const { input_method, file_name } = logEntry;

    // Delete associated file if it exists
    if (file_name) {
      let filePath;
      switch (input_method) {
        case 'text':
          filePath = path.join(textDir, file_name);
          break;
        case 'voice':
          filePath = path.join(audioDir, file_name);
          break;
        case 'photo':
          filePath = path.join(imageDir, file_name);
          break;
      }

      try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (error) {
        console.warn(`Could not delete file ${filePath}:`, error.message);
      }
    }

    // Delete from persistent storage
    await weaviateService.deleteDocument(logId);

    res.json({
      success: true,
      message: 'Log entry and associated file deleted successfully'
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

// GET /api/logging/stats/:userId - Get logging statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const documents = await weaviateService.getDocumentsByType('log', userId, 1000);
    const logs = documents.map(doc => doc.metadata);
    
    // Filter logs by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
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
    
    res.json({
      success: true,
      data: stats,
      period_days: parseInt(days)
    });

  } catch (error) {
    console.error('Stats retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

module.exports = router;
