const mongoose = require('mongoose');
const connection1 = require('../config/mongo1');

const SessionSchema =  mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    // token: { type: String, required: true },
    connected: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' }, // Session expires after 7 days
});

const SessionModel = connection1.model('Session', SessionSchema);
module.exports = SessionModel;