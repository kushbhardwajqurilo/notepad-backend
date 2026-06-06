const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const mongoURI2 = process.env.DB_URI;

const connection2 = mongoose.createConnection(mongoURI2);

connection2.on(
  "error",
  console.error.bind(console, "MongoDB connection error:"),
);
connection2.once("open", function () {
  console.log("Connected to Second MongoDB");
});

module.exports = connection2;

// mongodb+srv://qurilohrms:qurilobackupdata@notes.m7dpecx.mongodb.net/notepad
