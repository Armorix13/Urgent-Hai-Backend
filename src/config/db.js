import mongoose from 'mongoose';
import { MONGO_URI } from './index.js';

const connectDB = async () => {
  try {
    if(MONGO_URI !==undefined){
      await mongoose.connect(MONGO_URI);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;