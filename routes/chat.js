const express = require("express");
const {
  sendMessage,
  getMessage,
  newMessage,
  readMessage,
} = require("../controllers/chat");
const router = express.Router();

router.post("/send", sendMessage);
router.get("/get", getMessage);
router.get("/newmessage", newMessage);
router.post("/readmessage", readMessage);

module.exports = router;
