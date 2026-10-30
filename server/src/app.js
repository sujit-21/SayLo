const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statusRoutes = require('./routes/statusRoutes');
const callRoutes = require('./routes/callRoutes');
const channelRoutes = require('./routes/channelRoutes');
const communityRoutes = require('./routes/communityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded media statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/contacts', userRoutes);
app.use('/api/v1/conversations', chatRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/status', statusRoutes);
app.use('/api/v1/calls', callRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SAYLO Backend API', timestamp: new Date() });
});

// Serve frontend in production or if dist exists
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
