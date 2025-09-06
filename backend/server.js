const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit'); // Commented out due to Node.js version compatibility
require('dotenv').config();

const profileRoutes = require('./routes/profile');
const specCompliantRoutes = require('./routes/spec-compliant');
const structuredHealthRoutes = require('./routes/structured-health');
const enhancedHealthRoutes = require('./routes/enhanced-health');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting - commented out due to Node.js version compatibility
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
// app.use(limiter); // Commented out due to Node.js version compatibility
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/profile', profileRoutes);
app.use('/api/structured-health', structuredHealthRoutes);
app.use('/api/enhanced', enhancedHealthRoutes);

// Spec-compliant routes (exact match to DESIGN.md)
app.use('/', specCompliantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FitAura Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
