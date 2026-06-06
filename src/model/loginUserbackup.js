const mongoose = require('mongoose');
const { backupDb } = require('../config/normaldb');
const connection2 = require('../config/mongo2');
// require('../config/backupdb')
// backupDb();
const loginSchema = mongoose.Schema({
    password:{type:String},
    name:{type:String},
    orgId:{type:mongoose.SchemaTypes.ObjectId},
    
    // managerId:{type:mongoose.SchemaTypes.ObjectId}
},{
    timestamps:true
})

const loginBackup = connection2.model('userLoginBackup',loginSchema)
module.exports = loginBackup