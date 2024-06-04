const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();
const crypto = require("crypto");

router.post("/order", async (req, res) => {
  //   console.log(req.body);
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    const options = req.body;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json("Error");
    }

    res.json(order);
  } catch (error) {
    res.status(500).json("Error creating order");
    console.log(error);
  }
});

router.post("/order/validate", (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body.body;

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);

  //order_id + "|" + razorpay_payment_id, secret
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json("Transaction is not legit!");
  }

  res.status(200).json({
    msg: "Success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

module.exports = router;
