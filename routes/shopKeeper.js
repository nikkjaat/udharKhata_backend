const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProduct,
  addCustomer,
  getSingleCustomer,
  getCustomer,
  getCustomerData,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  filterCustomer,
  getAdminCustomers,
  updateCustomer,
  deleteCustomer,
  unreadNotification,
  getOTP,
  changeNumber,
  verifyOTP,
  verifyNewNumber,
  submitOTP,
  paidAmount,
  getPaidAmount,
  getPaidAmountId,
  updatePaidAmount,
  deletePaidAmount,
  deleteAllData,
  reminderForPayment,
} = require("../controllers/shopkeeper");
const isAuth = require("../middleware/isAuth");

router.post("/addproduct", isAuth, addProduct);
router.put("/updateproduct", isAuth, updateProduct);
router.delete("/deleteproduct", isAuth, deleteProduct);
router.post("/unreadnotification", isAuth, unreadNotification);
router.get("/getproduct", isAuth, getProduct);
router.post("/addcustomer", isAuth, addCustomer);
router.get("/getcustomer", isAuth, getCustomer);
router.get("/getsinglecustomer", isAuth, getSingleCustomer);
router.put("/updatecustomer", isAuth, updateCustomer);
router.delete("/deletecustomer", isAuth, deleteCustomer);
router.post("/changenumber", isAuth, changeNumber);
router.post("/verifyotp", isAuth, verifyOTP);
router.post("/getotp", isAuth, getOTP);
router.post("/verifynewnumber", isAuth, verifyNewNumber);
router.post("/submitotp", isAuth, submitOTP);
router.get("/getcustomerdata", isAuth, getCustomerData);
router.get("/getsingleproduct", isAuth, getSingleProduct);
router.get("/getadmincustomers", isAuth, getAdminCustomers);
router.get("/filtercustomer", isAuth, filterCustomer);
router.post("/paidamount", paidAmount);
router.get("/getpaidamount", getPaidAmount);
router.get("/getpaidamountbyid", getPaidAmountId);
router.put("/updatepaidamount", updatePaidAmount);
router.delete("/deletepaidamount", deletePaidAmount);
router.delete("/deletealldata", deleteAllData);
router.post("/reminderforpayment", isAuth, reminderForPayment);

module.exports = router;
