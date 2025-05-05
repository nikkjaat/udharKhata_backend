require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");

const app = express();

//PORT
const PORT = process.env.PORT;

//CORS POLICY
const cors = require("cors");
const corsOptions = require("./config/corsOption");
// Apply CORS middleware
app.use(cors(corsOptions));

//DATABASE
const connectDB = require("./database/database");
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ROUTES
const orderRoutes = require("./routes/order");
const adminRoutes = require("./routes/shopKeeper");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const customerRoute = require("./routes/customer");

app.use(userRoutes);
app.use(orderRoutes);
app.use("/message", chatRoutes);
app.use("/admin", adminRoutes);
app.use("/user", customerRoute);

mongoose.connection.once("open", () => {
  console.log("Connected to Databse");

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
});

mongoose.connection.once("error", (err) => {
  console.log(err);
});
