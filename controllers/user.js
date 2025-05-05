const User = require("../models/User");
const Customer = require("../models/Customer");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const { otpVerified } = require("../helper/verifiedOTP");
const jwt = require("jsonwebtoken");

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

  const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "",
  });

  res
    .status(200)
    .json({ message: "User Login Successfully", authToken, admin: true });
};

exports.getOtp = async (req, res, next) => {
  let number = req.query.number;

  if (!number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  number = String(number);
  if (number.startsWith("0")) {
    number = number.slice(1);
  }

  let customer = await Customer.find({ number: number });

  if (customer.length === 0) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  const twilioServiceSID = process.env.TWILIO_SERVICE_SID;

  // Initialize Twilio client
  const client = require("twilio")(twilioAccountSid, twilioAuthToken);

  async function sendVerificationCode(phoneNumber) {
    // console.log(phoneNumber);
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

exports.postUserLogin = async (req, res, next) => {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTHTOKEN;
  const twilioServiceSID = process.env.TWILIO_SERVICE_SID;
  let { number, otp } = req.body;
  // console.log(number);
  number = String(number);
  if (number.startsWith(0)) {
    number = number.slice(1);
  }

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

  const authToken = jwt.sign({ userId: number }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  verifyCode(number, otp)
    .then((verificationCheck) => {
      if (verificationCheck.status === "approved") {
        // Phone number verified successfully
        res.status(200).json({ message: "Successfully logged in", authToken });
      } else {
        // Verification failed
        res.status(404).json("Invalid OTP");
      }
    })
    .catch((error) => {
      // Handle error
      res.status(500).json({ message: error.message });
    });
};
