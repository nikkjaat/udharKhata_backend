const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getMyProducts,
  getItemsDetails,
  getShopkeeperName,
  getShopkeeper,
  checkNewNotification,
  readNotification,
  filterCustomer,
} = require("../controllers/customer");
const customerAuth = require("../middleware/customerAuth");

router.get("/getcustomers", customerAuth, getCustomers);
router.get("/getmyproducts", customerAuth, getMyProducts);
router.get("/getitemsdetails", customerAuth, getItemsDetails);
router.get("/getshopkeeper", customerAuth, getShopkeeper);
router.get("/getshopkeepername", customerAuth, getShopkeeperName);
router.post("/readnotification", customerAuth, readNotification);
router.get("/checknotification", customerAuth, checkNewNotification);
router.get("/filtercustomer", customerAuth, filterCustomer);

module.exports = router;
