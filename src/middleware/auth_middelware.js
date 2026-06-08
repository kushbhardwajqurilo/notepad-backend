const jwt = require("jsonwebtoken");
const Role = require("../config/Role");
require("dotenv").config();

exports.authmidleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_Key);
    console.log("decode", decoded);
    if (decoded) {
      req.user = decoded;
      next();
    } else {
      res.json({
        success: false,
        message: "Unothorization token",
      });
    }
  } catch (err) {
    res.json({
      success: false,
      message: "Unothorization token",
    });
  }
};
