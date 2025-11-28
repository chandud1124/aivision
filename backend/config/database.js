import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    // Enable mongoose debug in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

  } catch (error) {
    logger.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
