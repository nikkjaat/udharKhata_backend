const Product = require("../models/ShopKeeper");
const Customer = require("../models/Customer");
const Chat = require("../models/Chat");
const twilio = require("twilio");
const User = require("../models/User");
const { otpVerified } = require("../helper/verifiedOTP");

exports.addProduct = async (req, res, next) => {
  const { name, price, userId } = req.body;
  try {
    await Product.create({
      name,
      price,
      userId,
    });
    res.status(200).json({ message: "Product Added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Sever Error" });
  }
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
  // console.log(req.body);
  // console.log(req.user);
  // if (otp != req.user.otp) {
  //   return res.status(404).json({ message: "Invalid OTP" });
  // }

  // const isOtpExpired = otpVerified(req.user.otpExpiration);
  // if (isOtpExpired) {
  //   return res.status(403).json({ message: "Your OTP has been Expired" });
  // }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

  number = String(number);
  if (number.startsWith(0)) {
    number = number.slice(1);
  }

  // let customer = await Customer.find({ number: number, otp: otp });
  // if (customer.length === 0) {
  //   return res.status(404).json({ message: "Invalid OTP" });
  // }

  // const isOtpExpired = otpVerified(customer[0].otpExpiration);
  // if (isOtpExpired) {
  //   return res.status(403).json({ message: "Your OTP has been Expired" });
  // }

  const client = require("twilio")(twilioAccountSid, twilioAuthToken);

  async function verifyCode(phoneNumber, code) {
    try {
      const verificationCheck = await client.verify.v2
        .services(twilioServiceSID)
        .verificationChecks.create({
          to: `+91${phoneNumber}`,
          code: code,
        });
      return verificationCheck;
    } catch (error) {
      throw error;
    }
  }

  verifyCode(number, otp)
    .then((verificationCheck) => {
      if (verificationCheck.status === "approved") {
        // Phone number verified successfully
        Customer.create({
          name,
          number,
          shopkeeperName: req.user.name,
          userId: req.user._id,
        });

        res.status(200).json({ message: "Customer Added successfully" });
      } else {
        // Verification failed
        res.status(404).json("Invalid OTP");
      }
    })
    .catch((error) => {
      // Handle error
      res.status(500).json({ message: error.message });
    });

  // try {
  //   // If the loop completes without finding a matching customer, add the new customer
  //   await Customer.create({
  //     name,
  //     number,
  //     shopkeeperName: req.user.name,
  //     userId: req.user._id,
  //   });

  //   res.status(200).json({ message: "Customer Added successfully" });
  // } catch (err) {
  //   return res.status(500).json({ message: err.message });
  // }
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
  const customerId = req.query.customerId;
  const customerNumber = req.query.customerNumber;

  const conversationId = req.user._id + "?" + customerNumber;
  try {
    await Customer.findByIdAndDelete(customerId);
    await User.updateMany(
      { "myCustomer.customerId": customerId },
      { $pull: { myCustomer: { customerId: customerId } } }
    );

    await Product.deleteMany({ userId: customerId });

    await Chat.deleteMany({ conversationId });

    res.status(200).json({ message: "Customer Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOTP = async (req, res, next) => {
  const number = req.query.number;
  const myCustomer = req.user.myCustomer;
  // console.log(number);
  for (const customer of myCustomer) {
    const existingCustomer = await Customer.findOne({
      _id: customer.customerId,
    });
    if (existingCustomer.number === number) {
      return res.status(403).json({ message: "Customer Already Exists" });
    }
  }
  // Your Twilio Account SID and Auth Token
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

  // Initialize Twilio client
  const client = require("twilio")(twilioAccountSid, twilioAuthToken);

  async function sendVerificationCode(phoneNumber) {
    try {
      const verification = await client.verify.v2
        .services(twilioServiceSID)
        .verifications.create({
          to: `+91${phoneNumber}`,
          channel: "sms",
          timeToLive: 60,
        });
      return verification;
    } catch (error) {
      throw error;
    }
  }

  sendVerificationCode(number)
    .then((verification) => {
      // Handle success (optional)
      res.status(200).json({ message: "OTP sent successfully", verification });
    })
    .catch((error) => {
      // Handle error
      res
        .status(500)
        .json({ message: "Error sending OTP", error: error.message });
    });
};

exports.changeNumber = async (req, res, next) => {
  const number = req.query.number;

  // Your Twilio Account SID and Auth Token
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;

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
        from: twilioNumber,
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

exports.verifyOTP = async (req, res, next) => {
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

exports.verifyNewNumber = async (req, res, next) => {
  const { number } = req.body;
  const myCustomer = req.user.myCustomer;

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
        from: "+16613472824",
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

exports.verifyOTP = async (req, res, next) => {
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
      return res
        .status(200)
        .json({ message: "Customer not Available", data: [] });
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
    res.status(200).json({ message: "Product Deleted Successfully" });
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

exports.getAdminProduct = async (req, res, next) => {
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
