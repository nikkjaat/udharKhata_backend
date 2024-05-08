const Chat = require("../models/Chat");
const Customer = require("../models/Customer");
// const Conversation = require("../models/Conversation");

// exports.setConversation = async (req, res, next) => {
//   const { senderId, receiverId } = req.body;

//   try {
//     const isExist = await Conversation.findOne({
//       members: { $all: { senderId, receiverId } },
//     });

//     if (isExist) {
//       return res.status(200).json({ message: "Conversation already exists" });
//     }

//     const newConversation = new Conversation({
//       members: { senderId, receiverId },
//     });

//     await newConversation.save();

//     return res.status(200).json({ message: "Conversation saved successfully" });
//   } catch (error) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.sendMessage = async (req, res, next) => {
  const userId = req.body.message.senderId;
  const number = req.body.message.receiverId;
  const admin = req.body.message.admin;
  // console.log(userId, number, admin);
  try {
    const chat = new Chat(req.body.message);
    await chat.save();
  } catch (error) {
    return res.status(500).json(error.message);
  }

  try {
    let updateObject = {};
    if (admin) {
      updateObject.$set = { newCustomerMessage: true };
    } else {
      updateObject.$set = { newShopkeeperMessage: true };
    }

    await Customer.updateMany(
      { userId: admin ? userId : number, number: admin ? number : userId },
      updateObject
    );
    res.status(200).json("Message successfully sent");
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

exports.getMessage = async (req, res, next) => {
  try {
    const chat = await Chat.find({
      conversationId: req.query.conversationId,
    });
    // console.log(chat);
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

exports.newMessage = async (req, res, next) => {
  const userId = req.query.userId;
  const number = req.query.number;
  // console.log(number, userId);

  try {
    const customer = await Customer.findOne({
      userId: userId,
      number: number,
    });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

exports.readMessage = async (req, res, next) => {
  const userId = req.body.senderId;
  const number = req.body.receiverId;
  const admin = req.body.admin;
  // console.log(userId, number, admin);

  try {
    let updateObject = {};
    if (!admin) {
      updateObject.$set = { newCustomerMessage: false };
    } else {
      updateObject.$set = { newShopkeeperMessage: false };
    }

    await Customer.updateMany(
      { userId: admin ? userId : number, number: admin ? number : userId },
      updateObject
    );
    res.status(200).json("Read Message");
  } catch (error) {
    res.status(500).json(error.message);
  }
};
