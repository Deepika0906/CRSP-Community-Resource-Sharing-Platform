const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Make sure MongoDB is running locally (mongod) and MONGO_URI in .env is correct.');
    process.exit(1);
  }
};

module.exports = connectDB;
