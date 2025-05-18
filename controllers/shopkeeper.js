const Product = require("../models/ShopKeeper");
const Customer = require("../models/Customer");
const Chat = require("../models/Chat");
const twilio = require("twilio");
const User = require("../models/User");
const { otpVerified } = require("../helper/verifiedOTP");
const PaidAmount = require("../models/PaidAmount");
const ShopKeeper = require("../models/ShopKeeper");
const crypto = require("crypto");
const { default: mongoose } = require("mongoose");

exports.addProduct = async (req, res, next) => {
  const { name, price, userId } = req.body;
  // console.log(req.body);
  try {
    await Product.create({
      name,
      price,
      userId,
    });

    const totalAmount = await calculateTotalAmount(userId);

    await Customer.findByIdAndUpdate(userId, {
      $set: { totalAmount: totalAmount },
    });

    res.status(200).json({ message: "Product Added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Sever Error" });
  }
};

exports.getSingleCustomer = async (req, res, next) => {
  const userId = req.query.userId;

  try {
    const cust = await Customer.findById(userId);

    if (!cust) {
      return res.status(400).json({ data: [], message: "Customer not Found" });
    }

    return res.status(200).json({ data: cust });
  } catch (error) {
    return res.status(404).json({ message: error });
  }
};

exports.updateProduct = async (req, res, next) => {
  const { name, price } = req.body;
  const productId = req.query.productId;
  try {
    const product = await Product.findByIdAndUpdate(productId, {
      name,
      price,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const totalAmount = await calculateTotalAmount(product.userId);

    await Customer.findByIdAndUpdate(product.userId, {
      $set: { totalAmount: totalAmount },
    });

    res.status(200).json({ message: "Product updated Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.query.productId;

  try {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const totalAmount = await calculateTotalAmount(product.userId);

    await Customer.findByIdAndUpdate(product.userId, {
      $set: { totalAmount: totalAmount },
    });

    res.status(200).json({ message: "Product Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const calculateTotalAmount = async (userId) => {
  const shopkeeper = await ShopKeeper.find({ userId });
  if (!shopkeeper) return 0;

  const total = shopkeeper.reduce((acc, item) => acc + item.price, 0);
  return total;
};

exports.unreadNotification = async (req, res, next) => {
  const userId = req.query.userId;
  try {
    await Customer.updateMany(
      { _id: userId },
      { $set: { notification: true } }
    );
    res.status(200).json({ message: "New Notification" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const products = await Product.find({}).lean();
    if (products.length === 0) {
      return res
        .status(200)
        .json({ message: "Product not Available", data: [] });
    }
    res.status(200).json({ message: "Product available", data: products });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

exports.addCustomer = async (req, res, next) => {
  let { name, number, otp } = req.body;

  // const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  // const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  // const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

  // number = String(number);
  // if (number.startsWith(0)) {
  //   number = number.slice(1);
  // }

  // const client = require("twilio")(twilioAccountSid, twilioAuthToken);

  // async function verifyCode(phoneNumber, code) {
  //   try {
  //     const verificationCheck = await client.verify.v2
  //       .services(twilioServiceSID)
  //       .verificationChecks.create({
  //         to: `+91${phoneNumber}`,
  //         code: code,
  //       });
  //     return verificationCheck;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // verifyCode(number, otp)
  //   .then((verificationCheck) => {
  //     if (verificationCheck.status === "approved") {
  //       // Phone number verified successfully
  //       Customer.create({
  //         name,
  //         number,
  //         shopkeeperName: req.user.name,
  //         userId: req.user._id,
  //       });

  //       User.updateOne({});

  //       res
  //         .status(200)
  //         .json({ message: "Customer Added successfully", OTP: otp });
  //     } else {
  //       // Verification failed
  //       res.status(404).json("Invalid OTP");
  //     }
  //   })
  //   .catch((error) => {
  //     // Handle error
  //     res.status(500).json({ message: error.message });
  //   });

  try {
    const existingCustomer = await Customer.findOne({ number });
    if (existingCustomer) {
      return res.status(403).json({ message: "Customer Already Exists" });
    }

    // console.log(req.user, otp);

    if (req.user.otp !== otp || req.user.otpExpiration < new Date()) {
      return res.status(403).json({ message: "Invalid OTP" });
    }
    await Customer.create({
      name,
      number,
      shopkeeperName: req.user.name,
      userId: req.user._id,
    });

    res.status(200).json({ message: "Customer Added Successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res, next) => {
  const customerId = req.query.customerId;
  const { name, number } = req.body;

  try {
    const updateFields = { name }; // Initialize with the fields that can be updated
    if (number) {
      updateFields.number = number; // Include number in update if provided
    }

    const customer = await Customer.findById(customerId);

    await Chat.updateMany(
      {
        senderId: req.user._id,
        receiverId: customer.number,
      },
      {
        $set: {
          receiverId: number,
          conversationId: req.user._id + "?" + number,
        },
      }
    );

    await Chat.updateMany(
      {
        receiverId: req.user._id,
        senderId: customer.number,
      },
      {
        $set: { senderId: number, conversationId: req.user._id + "?" + number },
      }
    );

    await Customer.findByIdAndUpdate(customerId, updateFields);
    return res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res, next) => {
  console.log(req.body);
  const customerId = req.body.id;
  const customerNumber = req.body.number;

  const conversationId = req.user._id + "?" + customerNumber;
  try {
    await Customer.findByIdAndDelete(customerId);
    await User.updateMany(
      { "myCustomer.customerId": customerId },
      { $pull: { myCustomer: { customerId: customerId } } }
    );

    await Product.deleteMany({ userId: customerId });

    await Chat.deleteMany({ conversationId });

    await PaidAmount.deleteMany({ adminId: req.user._id, customerId });

    res.status(200).json({ message: "Customer Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.getOTP = async (req, res, next) => {
//   const number = req.query.number;
//   const myCustomer = req.user.myCustomer;
//   // console.log(number);
//   for (const customer of myCustomer) {
//     const existingCustomer = await Customer.findOne({
//       _id: customer.customerId,
//     });
//     if (existingCustomer.number === number) {
//       return res.status(403).json({ message: "Customer Already Exists" });
//     }
//   }
//   // Your Twilio Account SID and Auth Token
//   const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
//   const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
//   const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

//   // Initialize Twilio client
//   const client = require("twilio")(twilioAccountSid, twilioAuthToken);

//   async function sendVerificationCode(phoneNumber) {
//     try {
//       const verification = await client.verify.v2
//         .services(twilioServiceSID)
//         .verifications.create({
//           to: `+91${phoneNumber}`,
//           channel: "sms",
//           timeToLive: 60,
//         });
//       return verification;
//     } catch (error) {
//       throw error;
//     }
//   }

//   sendVerificationCode(number)
//     .then((verification) => {
//       // Handle success (optional)
//       res.status(200).json({ message: "OTP sent successfully", verification });
//     })
//     .catch((error) => {
//       // Handle error
//       res
//         .status(500)
//         .json({ message: "Error sending OTP", error: error.message });
//     });
// };

exports.getOTP = async (req, res, next) => {
  const number = req.query.number;
  const myCustomer = req.user.myCustomer;

  // Validate phone number
  if (!number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Format number (remove leading 0)
  const formattedNumber = String(number).replace(/^0/, "");

  // Check if customer already exists
  for (const customer of myCustomer) {
    const existingCustomer = await Customer.findOne({
      _id: customer.customerId,
    });
    if (existingCustomer && existingCustomer.number === formattedNumber) {
      return res.status(403).json({ message: "Customer Already Exists" });
    }
  }

  try {
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // In a real implementation, you would:
    // 1. Store this OTP in your database (either in a Customer record or separate OTP collection)
    // 2. Send it via your SMS gateway or other delivery method

    // For demonstration purposes, we'll log it to console
    // Remove this in production!
    // console.log(`OTP for ${formattedNumber}: ${otp}`);

    // Example database storage (uncomment and customize):

    await User.findOneAndUpdate(
      { number: req.user.number },
      {
        otp: otp,
        otpExpiration: otpExpiry,
      }
    );

    // In production, you would integrate with your SMS gateway here
    // For example:
    /*
    const smsResponse = await sendSMSViaGateway(
      formattedNumber, 
      `Your verification code is: ${otp}`
    );
    */

    res.status(200).json({
      message: "OTP sent successfully",
      // In production, don't send the OTP back to the client
      // This is just for demo/testing purposes
      otp: otp,
    });
  } catch (error) {
    console.error("OTP generation error:", error);
    res.status(500).json({
      message: "Error generating OTP",
      error: error.message,
    });
  }
};

// exports.changeNumber = async (req, res, next) => {
//   const number = req.query.number;

//   // console.log(number);

//   // Your Twilio Account SID and Auth Token
//   const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
//   const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
//   const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

//   // Initialize Twilio client
//   const client = require("twilio")(twilioAccountSid, twilioAuthToken);

//   async function sendVerificationCode(phoneNumber) {
//     try {
//       const verification = await client.verify.v2
//         .services(twilioServiceSID)
//         .verifications.create({
//           to: `+91${phoneNumber}`,
//           channel: "sms",
//           timeToLive: 60,
//         });
//       return verification;
//     } catch (error) {
//       throw error;
//     }
//   }

//   sendVerificationCode(number)
//     .then((verification) => {
//       // Handle success
//       res.status(200).json({ message: "OTP sent successfully", verification });
//     })
//     .catch((error) => {
//       // Handle error
//       res
//         .status(500)
//         .json({ message: "Error sending OTP", error: error.message });
//     });
// };

// exports.verifyOTP = async (req, res, next) => {
//   let { number, otp } = req.body;

//   const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
//   const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
//   const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

//   number = String(number);
//   if (number.startsWith(0)) {
//     number = number.slice(1);
//   }

//   const client = require("twilio")(twilioAccountSid, twilioAuthToken);

//   async function verifyCode(phoneNumber, code) {
//     try {
//       const verificationCheck = await client.verify.v2
//         .services(twilioServiceSID)
//         .verificationChecks.create({
//           to: `+91${phoneNumber}`,
//           code: code,
//         });
//       return verificationCheck;
//     } catch (error) {
//       throw error;
//     }
//   }

//   verifyCode(number, otp)
//     .then((verificationCheck) => {
//       if (verificationCheck.status === "approved") {
//         // Phone number verified successfully

//         res.status(200).json({ message: "Number Verified successfully" });
//       } else {
//         // Verification failed
//         res.status(404).json("Invalid OTP");
//       }
//     })
//     .catch((error) => {
//       // Handle error
//       res.status(500).json({ message: error.message });
//     });
// };

exports.changeNumber = async (req, res, next) => {
  const number = req.user.number;

  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    req.user.otp = otp;
    req.user.otpExpiration = otpExpiry;

    await req.user.save();

    res.status(200).json({ message: "OTP sent successfully", otp: otp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = (req, res, next) => {
  const { number, otp } = req.body;

  // Check if the OTP is valid
  // if (otp !== req.user.otp) {
  //   return res.status(403).json({ message: "Invalid OTP" });
  // }

  // // Check if the OTP has expired
  // const isOtpExpired = otpVerified(req.user.otpExpiration);
  // if (isOtpExpired) {
  //   return res.status(403).json({ message: "Your OTP has been Expired" });
  // }

  // // Update the user's number in the database
  // User.findByIdAndUpdate(req.user._id, { number: number })
  //   .then(() => {
  //     res.status(200).json({ message: "Number Verified successfully" });
  //   })
  //   .catch((error) => {
  //     res.status(500).json({ message: error.message });
  //   });

  try {
    if (otp == !req.user.otp || req.user.otpExpiration < new Date()) {
      return res.status(403).json({ message: "Invalid OTP or Expired" });
    }
    res.status(200).json({ message: "Number Verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyNewNumber = async (req, res, next) => {
  const myCustomer = req.user.myCustomer;
  const { number } = req.body;
  // console.log(number);

  try {
    for (const customer of myCustomer) {
      const existingCustomer = await Customer.findOne({
        _id: customer.customerId,
      });
      if (existingCustomer.number === number) {
        return res.status(403).json({ message: "Customer Already Exists" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }

  // Your Twilio Account SID and Auth Token
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;

  // Create Twilio client
  const client = twilio(twilioAccountSid, twilioAuthToken);

  // Function to generate a random OTP
  function generateOTP() {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  const sendOTP = async (phoneNumber, otp) => {
    // console.log(req.user.number);

    const cDate = new Date();
    await User.findOneAndUpdate(
      { number: req.user.number },
      { otp: otp, otpExpiration: new Date(cDate.getTime()) },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
    try {
      client.messages.create({
        body: `Your OTP is: ${otp}`,
        to: `+91${phoneNumber}`,
        from: "+18143245452",
      });

      res.status(200).json({ message: "OTP sent Successfully", otp: otp });
    } catch (err) {
      res.status(500).json({ message: err });
    }
  };

  // Example usage
  const phoneNumber = number; // Replace with the recipient's phone number
  const otp = generateOTP();
  sendOTP(phoneNumber, otp);
};

exports.submitOTP = async (req, res, next) => {
  const { otp } = req.body;
  try {
    if (otp != req.user.otp) {
      return res.status(404).json({ message: "Invalid OTP" });
    }

    const isOtpExpired = otpVerified(req.user.otpExpiration);
    if (isOtpExpired) {
      return res.status(403).json({ message: "Your OTP has been Expired" });
    }
    res
      .status(200)
      .json({ success: true, message: "OTP Verification Success" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

exports.getCustomer = async (req, res, next) => {
  const userId = req.user._id;
  try {
    const customers = await Customer.find({ userId });
    if (customers.length === 0) {
      return res.status(200).json({ message: "Customer not Exists", data: [] });
    }
    res.status(200).json({ message: "Customer Fetched", data: customers });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

exports.getCustomerData = async (req, res, next) => {
  const userId = req.query.userId;
  // console.log(userId);
  try {
    const user = await Customer.findById(userId);
    const products = await Product.find({ userId: userId });
    if (!products) {
      return res.status(404).json({ message: "Data not Available" });
    }
    res
      .status(200)
      .json({ message: "Data Fetched", products: products, user: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSingleProduct = async (req, res, next) => {
  const productId = req.query.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product Fetched", product: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.filterCustomer = async (req, res, next) => {
  const filterCustomer = req.query.filter;

  try {
    // Populate the 'myCustomer' field of the user
    const user = await req.user.populate("myCustomer.customerId");

    let customers = [];

    if (!filterCustomer || filterCustomer.trim() === "") {
      // If no filter provided, return all customers associated with the user
      customers = user.myCustomer.map((customer) => customer.customerId);
      return res
        .status(200)
        .json({ message: "No customers found", data: customers, admin: true });
    } else {
      const firstChar = filterCustomer.charAt(0);
      const filterRegex = new RegExp(filterCustomer, "i");

      if (!isNaN(firstChar)) {
        // Filter by number
        customers = user.myCustomer.filter((customer) =>
          customer.customerId.number.match(filterRegex)
        );
      } else {
        // Filter by name
        customers = user.myCustomer.filter((customer) =>
          customer.customerId.name.match(filterRegex)
        );
      }
    }

    // Extract the customer IDs
    const customerIds = customers.map((customer) => customer.customerId);

    // Find the corresponding customers from the Customer model
    const filteredCustomers = await Customer.find({
      _id: { $in: customerIds },
    });

    if (filteredCustomers.length === 0) {
      return res
        .status(203)
        .json({ message: "No customers found", data: customers, admin: true });
    }

    res.status(200).json({
      message: "Customers successfully fetched",
      data: filteredCustomers,
      admin: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminCustomers = async (req, res, next) => {
  let customers = await Customer.find({});
  customers.forEach(async (customers) => {
    if (customers.userId === req.user.id) {
      await req.user.getAdminProduct(customers.id);
    }
  });

  const customerProduct = await req.user.populate("myCustomer.customerId");

  if (customerProduct.myCustomer.length <= 0) {
    return res.status(204).json({ message: "Customer Product not Available" });
  }

  res.status(200).json({
    message: "Customer Product fetched Successfully",
    data: customerProduct.myCustomer,
  });
};

exports.paidAmount = async (req, res, next) => {
  const { customerId, adminId } = req.body;
  try {
    // check if customer Exist or not
    const customer = await Customer.find({ _id: customerId });
    if (!customer) {
      return res.status(404).json("Customer not found");
    }

    await PaidAmount.create(req.body);
    await totalPaidAmount(customerId, adminId);
    // console.log(totalPaidamount);

    res.status(200).json({ message: "Amount paid Successfully" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const totalPaidAmount = async (customerId, adminId) => {
  const paidAmount = await PaidAmount.find({
    customerId,
    adminId,
  });
  if (!paidAmount) return 0;

  const total = paidAmount.reduce((acc, item) => acc + item.amount, 0);
  await Customer.findByIdAndUpdate(customerId, {
    $set: { paidAmount: total },
  });
};

exports.getPaidAmount = async (req, res, next) => {
  const { adminId, customerId } = req.query;

  if (!adminId || !customerId) {
    return res.status(400).json({ message: "Missing adminId or customerId" });
  }

  try {
    const data = await PaidAmount.find({ adminId, customerId });
    if (data.length === 0) {
      return res.status(204).json("No paid amounts");
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching paid amounts:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getPaidAmountId = async (req, res, next) => {
  try {
    const data = await PaidAmount.findById(req.query.id);
    if (!data) {
      return res
        .status(404)
        .json(`Amount not available to match this id = ${req.query.id}`);
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

exports.updatePaidAmount = async (req, res, next) => {
  // console.log(req.query.id);
  try {
    await PaidAmount.findByIdAndUpdate(req.query.id, req.body);
    await totalPaidAmount(req.body.customerId, req.body.adminId);
    res.status(200).json({ message: "Amount Updated Successfully" });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

exports.deletePaidAmount = async (req, res, next) => {
  try {
    await PaidAmount.findByIdAndDelete(req.query.id);
    await totalPaidAmount(req.body.customerId, req.body.adminId);
    res.status(200).json({ message: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllData = async (req, res, next) => {
  const { adminId, customerId } = req.query;
  try {
    await PaidAmount.deleteMany({ adminId, customerId });
    await Product.deleteMany({ userId: customerId });
    res.status(200).json("Deleted Successfully");
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.reminderForPayment = async (req, res, next) => {
  const { customerId } = req.body;
  // console.log(customerId);
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
    // const twilioServiceSID = process.env.TWILIO_SERVICE_SID;
    const client = require("twilio")(twilioAccountSid, twilioAuthToken);
    const message = await client.messages.create({
      body: `Dear ${
        customer.name
      },\n\nThis is a reminder for your pending payment of ₹${
        customer.totalAmount - customer.paidAmount
      }.\nPlease make the payment at your earliest convenience.\n\nRegards : ${
        req.user.name
      } \nThank you!`,
      to: `+91${customer.number}`,
      from: `${process.env.TWILIO_NUMBER}`,
    });
    res.status(200).json({ message: "Reminder sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
