import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Kết nối với MongoDB sử dụng URI từ file .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Dừng app nếu kết nối thất bại
  }
};

export default connectDB;
