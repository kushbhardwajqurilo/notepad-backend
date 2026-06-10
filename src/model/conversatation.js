const mongoose = require("mongoose");
const connection1 = require("../config/mongo1");

const conversationSchema = mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "userLogin" }],
    message: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: [] },
    ],
  },
  {
    timestamps: true,
  },
);
const conversationModel = connection1.model("Conversation", conversationSchema);
module.exports = conversationModel;
