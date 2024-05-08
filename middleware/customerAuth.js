const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const customerAuth = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(404).json({ message: "Authorization Required" });
  }

  const token = req.headers.authorization.split(" ")[1];
  //   console.log(token);

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log(decodedToken.num);
    const user = await Customer.find({ number: decodedToken.num });
    // console.log(user);
    if (!user) {
      return res.status(401).json({ message: "Not Authorized User" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
};

module.exports = customerAuth;
