const mongoose = require('mongoose')
const { backupDb } = require('../config/normaldb')
const connection2 = require('../config/mongo2')
// backupDb();
const notesSchema = mongoose.Schema({
    orgId:{type:mongoose.SchemaTypes.ObjectId},
    content:{type: String},
    userId:{type:mongoose.SchemaTypes.ObjectId},
    createdAt:{type:Date},
    updatedAt:{type:Date},
    updateStatus:{type:Boolean}
})

const NotesBackup = connection2.model("notesbackup",notesSchema)
module.exports = NotesBackup