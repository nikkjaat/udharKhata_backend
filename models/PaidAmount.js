const mongoose = require("mongoose");

const PaidAmountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaidAmount", PaidAmountSchema);
