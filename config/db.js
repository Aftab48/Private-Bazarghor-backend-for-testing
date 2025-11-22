const mongoose = require("mongoose");
const runSeeders = require("../api/seeders/index");

const connectDB = async () => {
  mongoose.set("strictQuery", false);
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Run seeders on startup (optional)
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await runSeeders();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
