const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    text: {
      type: String,
      required: true,
    },
    conversationId: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("chat", ChatSchema);
