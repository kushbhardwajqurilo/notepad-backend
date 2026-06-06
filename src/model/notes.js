const mongoose = require('mongoose')
const connection1 = require('../config/mongo1')

const notesSchema = mongoose.Schema({
    title:{type:String},
    content:{type: String},
    userId:{type:mongoose.SchemaTypes.ObjectId},
    updateStatus:{type:Boolean},
},{
    timestamps:true
})

const NotesModel = connection1.model("notes",notesSchema)
module.exports = NotesModel