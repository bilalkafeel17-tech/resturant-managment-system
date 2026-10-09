import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSockets } from './sockets/socketHandler.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP & Socket.IO server
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
    });

    // Attach io instance to express app
    app.set('io', io);

    // 3. Initialize Socket.IO Handlers
    setupSockets(io);

    // 4. Start listening
    server.listen(PORT, () => {
      console.log(`
=====================================================
  🚀 Servora Restaurant Management Server Running!
  📡 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 API: http://localhost:${PORT}/api/health
=====================================================
      `);
    });

    // Graceful Shutdown
    const handleShutdown = () => {
      console.log('Received termination signal. Closing server cleanly...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error.message);
    process.exit(1);
  }
};

startServer();
