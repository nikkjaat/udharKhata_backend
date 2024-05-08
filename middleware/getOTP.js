const Customer = require("../models/Customer");
const twilio = require("twilio");
const { otpVerified } = require("../helper/verifiedOTP");

exports.getOTP = async (req, res, next) => {
  let number = req.query.number;

  number = String(number);
  // const cleanedNumber = number.replace(/^0+/, "");
  if (number.startsWith(0)) {
    number = number.slice(1);
  }

  let customer = await Customer.find({ number: number });

  if (customer.length === 0) {
    return res.status(404).json({ message: "Customer not found" });
  }

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
    const cDate = new Date();
    await Customer.updateMany(
      { number: number },
      { $set: { otp: otp, otpExpiration: new Date(cDate.getTime()) } },
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
