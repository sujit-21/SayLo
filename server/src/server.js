require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocketIO } = require('./sockets/socketHandler');
const { initMessageScheduler } = require('./utils/scheduler');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

initSocketIO(io);
initMessageScheduler(io);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SAYLO Server] Port ${PORT} is already in use by another process.`);
    console.error(`To kill the process using port ${PORT} on Windows, run:\n  cmd /c "for /f \\"tokens=5\\" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /f /pid %a"`);
    process.exit(1);
  } else {
    console.error('[SAYLO Server] Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`[SAYLO Server] Running on http://localhost:${PORT}`);
});

