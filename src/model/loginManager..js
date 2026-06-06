const mongoose = require('mongoose');
const { getPasswordHash } = require('../util/password');
const connection1 = require('../config/mongo1');

const ManagerLoginSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true }
},{
    timestamps: true
});

ManagerLoginSchema.pre('save', function () {
    this.password = getPasswordHash(this.password);
})

const managerModel= connection1.model('ManagerLogin', ManagerLoginSchema);
module.exports = managerModel