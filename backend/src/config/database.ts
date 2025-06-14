import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('❌ MongoDB URI is not defined in environment variables');
      console.log('💡 Please check your .env file and ensure MONGODB_URI is set');
      console.log('💡 For local development: mongodb://localhost:27017/quan-ly-khoa-hoc');
      console.log('💡 For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/quan-ly-khoa-hoc');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 MongoDB server is not running. Please start MongoDB:');
      console.log('   - For local: mongod --dbpath ./data/db');
      console.log('   - Or use MongoDB Atlas (cloud database)');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 MongoDB authentication failed. Please check your credentials.');
    } else if (error.message.includes('Server selection timed out')) {
      console.log('💡 Cannot connect to MongoDB server. Please check:');
      console.log('   - MongoDB is running');
      console.log('   - Connection string is correct');
      console.log('   - Network connectivity');
    }

    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};
