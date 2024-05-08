const express = require("express");
const router = express.Router();

const {
  postSignup,
  postLogin,
  postUserLogin,
  getOtp,
} = require("../controllers/user");

// const {getOTP} = require('../middleware/getOTP')

// ADMIN ROUTES
router.post("/admin/signup", postSignup);
router.post("/admin/login", postLogin);

// CUSTOMER ROUTES
router.post("/user/getotp", getOtp);
router.post("/user/login", postUserLogin);

module.exports = router;
