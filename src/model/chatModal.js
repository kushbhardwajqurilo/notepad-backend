const mongoose = require("mongoose");
const connection1 = require("../config/mongo1");

const MessageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "userLogin" },
    attachment: { type: String, default: null },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

const MessageModel = connection1.model("Message", MessageSchema);
module.exports = MessageModel;
  
