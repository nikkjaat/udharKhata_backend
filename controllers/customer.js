const Customer = require("../models/Customer");
const Shop = require("../models/ShopKeeper");
const User = require("../models/User");

exports.getCustomers = async (req, res, next) => {
  const customer = await Customer.find({ number: req.query.number });
  try {
    if (customer.length === 0) {
      return res
        .status(404)
        .json({ message: "customer not found", data: customer });
    }
    res
      .status(200)
      .json({ message: "Fetched Customer successfully", data: customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.readNotification = async (req, res, next) => {
  const userId = req.query.userId;
  try {
    await Customer.updateMany(
      { _id: userId },
      { $set: { notification: false } }
    );
    res.status(200).json({ message: "Read Notification" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProducts = async (req, res, next) => {
  const userId = req.query.userId;

  try {
    const shop = await Shop.find({ userId: userId });
    if (shop.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User fetched successfully", data: shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getItemsDetails = async (req, res, next) => {
  const userId = req.query.userId;

  try {
    const myItems = await Shop.find({ userId });
    if (myItems.length === 0) {
      return res.status(404).json({ message: "Your Items not found" });
    }
    res
      .status(200)
      .json({ message: "My Items fetched successfully", data: myItems });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShopkeeper = async (req, res, next) => {
  const adminId = req.query.adminId;
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin found", data: admin });
  } catch (err) {
    return res.status(50).json({ message: err.message });
  }
};

exports.getShopkeeperName = async (req, res, next) => {
  const userId = req.query.userId;
  try {
    const shopkeeper = await Customer.findById(userId);
    if (!shopkeeper) {
      return res.status(404).json({ message: "Not Found" });
    }
    // console.log(shopkeeper);
    res.status(200).json({
      message: "Successfully Found Shoopkeeper Name",
      data: shopkeeper,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkNewNotification = async (req, res, next) => {
  const number = req.query.number;
  try {
    const customer = await Customer.findById(number);
    if (customer.length === 0) {
      return res.status(404).json({ message: err.message });
    }
    res.status(200).json({ message: "Fetched customer", data: customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.filterCustomer = async (req, res, next) => {
  const filter = req.query.filter;
  const number = req.user[0].number;
  let customers = [];
  try {
    customers = await Customer.find({
      shopkeeperName: { $regex: `${filter}`, $options: "i" },
      number: number,
    });

    res
      .status(200)
      .json({ message: "Customer successfully filtered", data: customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
