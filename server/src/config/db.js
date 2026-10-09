import mongoose from 'mongoose';

/**
 * MongoDB Connection Handler
 */
export const connectDB = async (uriOverride = null) => {
  const uri = uriOverride || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/servora_db';
  
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
    });

    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error) {
    console.error(`[Database Error] Disconnect failed: ${error.message}`);
  }
};
