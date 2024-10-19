require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//PORT
const PORT = process.env.PORT;

//CORS POLICY
const cors = require("cors");
const corsOptions = require("./config/corsOption");


//DATABASE
const connectDB = require("./database/database");
connectDB();
app.options('*', cors(corsOptions)); // Enable preflight across-the-board

// app.use(cors(corsOptions));
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

// io.on("connection", (socket) => {
//   console.log("New client connected", socket.id);

//   // Example: Handling chat messages
//   socket.on("chatMessage", (message) => {
//     console.log("Received message:", message);
//     io.emit("chatMessage", message); // Broadcast message to all connected clients
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

mongoose.connection.once("open", () => {
  console.log("Connected to Databse");

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
});

mongoose.connection.once("error", (err) => {
  console.log(err);
});
