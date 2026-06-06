// models/Message.js
const mongoose = require('mongoose');
const connection1 = require('../config/mongo1');

const MessageSchema =  mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId},
  receiver: { type: mongoose.Schema.Types.ObjectId},
  attachment: { type: String },
   message: { type: String },
   read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});
const MessageModel = connection1.model('Message', MessageSchema);
module.exports = MessageModel
  