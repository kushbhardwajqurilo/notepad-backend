const mongoose = require("mongoose");
let mainDbConnection;
let backupDbConnection;

exports.mainDb = async () => {
  try {
    mainDbConnection = await mongoose.createConnection(
      "mongodb://localhost:27017/notepad",
    );
  } catch (error) {
    console.log(error);
  }
};
// mongodb+srv://qurilo73:6bzuEu1Hqkcmpzt7@cluster0.xxvrf0r.mongodb.net/notepad?retryWrites=true&w=majority

exports.backupDb = async () => {
  try {
    backupDbConnection = await mongoose.createConnection(
      "mongodb+srv://qurilohrms:qurilobackupdata@notes.m7dpecx.mongodb.net/notepad",
    );
  } catch (error) {
    console.log(error);
  }
};
