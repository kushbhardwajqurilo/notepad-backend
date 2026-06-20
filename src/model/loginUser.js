const mongoose = require("mongoose");
// const { getPasswordHash } = require('../util/password');
const connection1 = require("../config/mongo1");

const loginSchema = mongoose.Schema(
  {
    password: { type: String },
    name: { type: String },
    managerId: { type: mongoose.SchemaTypes.ObjectId },
    email: { type: String, default: "" },
    newMessages: {
      type: Map,
      of: Number,
      default: {},
    },
    role: { type: String },
  },
  {
    timestamps: true,
  },
);

// loginSchema.pre('save',function(){
//   this.password = getPasswordHash(this.password);
// })

const loginModel = connection1.model("userLogin", loginSchema);
module.exports = loginModel;
