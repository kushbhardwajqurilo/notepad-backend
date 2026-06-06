const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const mongoURI1 = process.env.DB_URI;

const connection1 = mongoose.createConnection(mongoURI1);

connection1.on(
  "error",
  console.error.bind(console, "MongoDB connection error:"),
);
connection1.once("open", function () {
  console.log("Connected to First MongoDB");
});

module.exports = connection1;

// mongodb+srv://qurilo73:6bzuEu1Hqkcmpzt7@cluster0.xxvrf0r.mongodb.net/notepad?retryWrites=true&w=majority
