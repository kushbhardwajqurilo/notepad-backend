const Role = require("../../config/Role");
const managerModel = require("../../model/loginManager.");
const loginModel = require("../../model/loginUser");
const { isVerify } = require("../../util/password");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.loginAdmin = async (req, res) => {
  try {
    const data = req.body;
    // console.log(data)
    const loginData = await loginModel.findOne({ email: data.email });
    console.log(loginData);
    if (!loginData) {
      return res.status(400).json({
        message: "Email Not Match",
      });
    }
    if (loginData.role == Role.Manager) {
      if (data.password == loginData.password) {
        const token = jwt.sign(
          { id: loginData._id, role: Role.Manager, name: loginData.name },
          process.env.JWT_Key,
          { expiresIn: "1h" },
        );
        return res.json({
          token: token,
          id: loginData._id,
          name: loginData.name,
          status: "success",
          message: "Login Success",
        });
      } else {
        return res.status(400).json({
          message: "Password Not Match",
        });
      }
    }
  } catch (error) {
    return res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.signUpAdmin = async (req, res) => {
  try {
    const data = req.body;
    const objData = {
      email: data.email,
      password: data.password,
      name: data.name,
      role: Role.Manager,
    };
    const existEmail = await loginModel.findOne({ email: data?.email });
    if (existEmail) {
      return res.status(400).json({
        status: "failed",
        message: "Email Already Used",
      });
    }
    const loginCreate = await loginModel.create(objData);
    console.log("creattet", loginCreate);
    if (loginCreate) {
      return res.status(200).json({
        message: "Account Created",
      });
    } else {
      return res.status(400).json({
        message: "Account Not Created",
      });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(501).json({
      message: "Internal Server Error",
    });
  }
};
