import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    maxPoolSize: 10,
  };

  try {
    await mongoose.connect(uri, options);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection attempt failed:', error.message);
    throw error;
  }
};

export default connectDB;
