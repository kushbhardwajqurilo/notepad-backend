const mongoose = require('mongoose')
const { mainDbConnection, mainDb } = require('../config/normaldb')
const connection1 = require('../config/mongo1')
const draftSchema = mongoose.Schema({
    isDrafy: { type: Boolean },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String }
}, {
    timestamps: true
})

const draftModel = connection1.model('Draft', draftSchema)
module.exports = draftModel