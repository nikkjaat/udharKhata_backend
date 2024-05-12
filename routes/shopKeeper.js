const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProduct,
  addCustomer,
  getCustomer,
  getCustomerData,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  filterCustomer,
  getAdminProduct,
  updateCustomer,
  deleteCustomer,
  unreadNotification,
  readNotification,
  getOTP,
  changeNumber,
  verifyOTP,
  verifyNewNumber,
  submitOTP,
  paidAmount,
  getPaidAmount,
} = require("../controllers/shopkeeper");
const isAuth = require("../middleware/isAuth");

router.post("/addproduct", isAuth, addProduct);
router.post("/unreadnotification", isAuth, unreadNotification);
router.get("/getproduct", isAuth, getProduct);
router.post("/addcustomer", isAuth, addCustomer);
router.put("/updatecustomer", isAuth, updateCustomer);
router.delete("/deletecustomer", isAuth, deleteCustomer);
router.post("/getotp", isAuth, getOTP);
router.post("/changenumber", isAuth, changeNumber);
router.post("/verifyotp", isAuth, verifyOTP);
router.post("/submitotp", isAuth, submitOTP);
router.post("/verifynewnumber", isAuth, verifyNewNumber);
router.get("/getcustomer", isAuth, getCustomer);
router.get("/getcustomerdata", isAuth, getCustomerData);
router.get("/getsingleproduct", isAuth, getSingleProduct);
router.put("/updateproduct", isAuth, updateProduct);
router.delete("/deleteproduct", isAuth, deleteProduct);
router.get("/filtercustomer", isAuth, filterCustomer);
router.get("/getadmincustomers", isAuth, getAdminProduct);
router.post("/paidamount", isAuth, paidAmount);
router.get("/getpaidamount",  getPaidAmount);

module.exports = router;
