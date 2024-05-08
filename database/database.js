const mongoose = require("mongoose");

const mongoConnect = async () => {
  await mongoose.connect(process.env.DB_URI);
};

module.exports = mongoConnect;
