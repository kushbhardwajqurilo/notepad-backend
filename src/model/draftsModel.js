const mongoose = require('mongoose')
const connection1 = require('../config/mongo1')

const draftSchema = mongoose.Schema({
    content: String,
    updatedAt: { type: Date, default: Date.now },
})

const Draft = connection1.model('DraftData', draftSchema)

module.exports = Draft