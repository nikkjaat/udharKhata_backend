const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
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
  myCustomer: [
    {
      customerId: {
        type: mongoose.Types.ObjectId,
        ref: "Customer",
      },
    },
  ],
});

UserSchema.methods.getAdminProduct = async function (customerId) {
  let myCustomer = this.myCustomer;

  const existCustomer = myCustomer.findIndex(
    (customer) => customer.customerId.toString() === customerId
  );

  if (existCustomer < 0) {
    myCustomer.push({ customerId: customerId });
    this.myCustomer = myCustomer;
    return this.save();
  }
};

module.exports = mongoose.model("User", UserSchema);
