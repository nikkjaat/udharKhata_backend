const User = require("../models/User");
const Customer = require("../models/Customer");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const { otpVerified } = require("../helper/verifiedOTP");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.postSignup = async (req, res, next) => {
  let { name, number, password } = req.body;

  number = String(number);
  if (number.startsWith(0)) {
    number = number.slice(1);
  }

  try {
    const user = await User.findOne({ number });
    if (user) {
      return res.status(409).json({ message: "User Already Exists" });
    }

    let hashPassword;
    try {
      hashPassword = await bcrypt.hash(password, 8);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }

    await User.create({ name, number, password: hashPassword });
    res.status(200).json({ message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.postLogin = async (req, res, next) => {
  let { number, password } = req.body;
  // console.log(number);
  number = String(number);
  // const cleanedNumber = number.replace(/^0+/, "");
  if (number.startsWith(0)) {
    number = number.slice(1);
  }

  // console.log(cleanedNumber);
  const user = await User.findOne({ number: number });
  try {
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  try {
    const passwordMatched = await bcrypt.compare(password, user.password);

    if (!passwordMatched) {
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

  const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

  res
    .status(200)
    .json({ message: "User Login Successfully", authToken, admin: true });
};

// exports.getOtp = async (req, res, next) => {
//   let number = req.query.number;

//   if (!number) {
//     return res.status(400).json({ message: "Phone number is required" });
//   }

//   number = String(number);
//   if (number.startsWith("0")) {
//     number = number.slice(1);
//   }

//   let customer = await Customer.find({ number: number });

//   if (customer.length === 0) {
//     return res.status(404).json({ message: "Customer not found" });
//   }

//   const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
//   const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
//   const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

//   // Initialize Twilio client
//   const client = require("twilio")(twilioAccountSid, twilioAuthToken);

//   async function sendVerificationCode(phoneNumber) {
//     // console.log(phoneNumber);
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
//       res
//         .status(200)
//         .json({ message: "OTP sent successfully", verification, OTP: "" });
//     })
//     .catch((error) => {
//       // Handle error
//       res
//         .status(500)
//         .json({ message: "Error sending OTP", error: error.message });
//     });
// };

exports.getOtp = async (req, res, next) => {
  let number = req.query.number;

  // Validation
  if (!number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Format number (remove leading 0)
  number = String(number).replace(/^0/, "");

  // Check if customer exists
  let customer = await Customer.findOne({ number: number });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  try {
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP in database (you can use Redis for better performance)
    customer.otp = otp;
    customer.otpExpiration = otpExpiry;
    await customer.save();

    // TODO: Implement your actual OTP delivery mechanism here
    // This is where you would integrate with your SMS gateway or other service

    // For demo purposes, we'll log the OTP to console
    // console.log(`OTP for ${number}: ${otp}`); // Remove this in production!

    // If you want to implement email OTP as well (optional):
    /*
    if (customer.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        to: customer.email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
      });
    }
    */

    // Response to frontend (don't send OTP in production!)
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

// exports.postUserLogin = async (req, res, next) => {
//   const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
//   const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
//   const twilioServiceSID = process.env.TWILIO_SERVICE_SID;
//   let { number, otp } = req.body;

//   number = String(number);
//   if (number.startsWith(0)) {
//     number = number.slice(1);
//   }

//   const client = require("twilio")(twilioAccountSid, twilioAuthToken);

//   async function verifyCode(phoneNumber, code) {
//     try {
//       return await client.verify.v2
//         .services(twilioServiceSID)
//         .verificationChecks.create({
//           to: `+91${phoneNumber}`,
//           code: code,
//         });
//     } catch (error) {
//       throw error;
//     }
//   }

//   try {
//     const verificationCheck = await verifyCode(number, otp);

//     if (verificationCheck.status === "approved") {
//       const authToken = jwt.sign(
//         {
//           userId: number,
//           role: "user", // Add role to JWT payload
//         },
//         process.env.JWT_SECRET_KEY,
//         { expiresIn: "1d" }
//       );

//       res.status(200).json({
//         message: "Successfully logged in",
//         authToken,
//         admin: false, // Also send role in response
//       });
//     } else {
//       res.status(404).json("Invalid OTP");
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.postUserLogin = async (req, res, next) => {
  let { number, otp } = req.body;

  // Format phone number (remove leading 0 if present)
  number = String(number).replace(/^0/, "");

  try {
    // Find customer with matching number and valid OTP
    const customer = await Customer.findOne({
      number: number,
      // otpExpiry: { $gt: new Date() }, // Check if OTP is still valid
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: "Customer not found or OTP expired" });
    }

    // Verify OTP matches
    if (customer.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    customer.otp = undefined;
    customer.otpExpiry = undefined;
    await customer.save();

    // Generate JWT token
    const authToken = jwt.sign(
      {
        userId: number,
        role: "user",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Successfully logged in",
      authToken,
      admin: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};
