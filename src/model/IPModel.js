const mongoose = require("mongoose");
const connection1 = require("../config/mongo1");
const IpBLockSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      unqiue: true,
      required: true,
      index: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const IpBlockModel = connection1.model("IP", IpBLockSchema);
module.exports = IpBlockModel;
