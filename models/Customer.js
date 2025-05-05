const mongoose = require("mongoose");

const addCustomer = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  shopkeeperName: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  notification: {
    type: Boolean,
    default: false,
  },
  newCustomerMessage: {
    type: Boolean,
    default: false,
  },
  newShopkeeperMessage: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpiration: {
    type: Date,
    default: Date.now,
    get: (otpExpiration) => otpExpiration.getTime(),
    set: (otpExpiration) => new Date(otpExpiration),
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Customer", addCustomer);
