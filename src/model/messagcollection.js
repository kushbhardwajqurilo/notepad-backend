const mongoose = require('mongoose')
const connection1 = require('../config/mongo1')

const messageSchema = mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    receiverId: { type: mongoose.Schema.Types.ObjectId , ref:'User' },
    message: { type: String },
    
}, {
    timestamps: true
})
const messageModel = connection1.model('Message', messageSchema)
module.exports = messageModel