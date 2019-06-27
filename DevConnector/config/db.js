const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectdb = async () => {
  try {
    mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true
    });
    console.log("db connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1); //exit the process with failure
  }
};

module.exports = connectdb;
