const mongoose = require("mongoose");
const connection1 = require("../config/mongo1");

const globalBlockIp = new mongoose.Schema({
  isGlobalBlocked: { type: Boolean, default: false },
});
const globalIpModel = connection1.model("globalBlock", globalBlockIp);
module.exports = globalIpModel;
