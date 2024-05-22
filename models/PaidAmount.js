const mongoose = require("mongoose");

const PaidAmountSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    customerId: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaidAmount", PaidAmountSchema);
