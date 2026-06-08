const Role = require("../../config/Role");
const loginModel = require("../../model/loginUser");
const NotesModel = require("../../model/notes");
const { isVerify } = require("../../util/password");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.loginUser = async (req, res) => {
  try {
    const data = req.body;
    const loginData = await loginModel.findOne(
      { name: data.name },
      { password: 1, name: 1, _id: 1 },
    );
    console.log("data", loginData);
    if (!loginData) {
      return res.status(400).json({
        message: "User Not Match",
      });
    }

    // if(isVerify(data.password,loginData.password)){
    if (data.password === loginData.password) {
      const token = jwt.sign(
        { id: loginData._id, role: Role.User, name: loginData.name },
        process.env.JWT_Key,
        { expiresIn: "1h" },
      );
      return res.json({
        status: "success",
        message: "Login Success",
        data: {
          name: loginData.name,
          id: loginData._id,
          token: token,
        },
      });
    } else {
      return res.status(400).json({
        status: "failed",
        message: "Password Not Match",
      });
    }
  } catch (error) {
    return res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const data = req.body;
    const objData = {
      password: data.password,
      name: data.name,
    };
    const loginData = await loginModel.findOne({ name: data.name });
    if (loginData) {
      return res.json({
        status: "failed",
        message: "User Already Exist",
      });
    }
    const loginCreate = await loginModel.create(objData);
    if (loginCreate) {
      res.json({
        status: "success",
        message: "Account Created",
      });
    } else {
      res.json({
        message: "Account Not",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.ManagerLoginUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userFind = await loginModel.findOne({ _id: userId });
    const tokenCreate = jwt.sign(
      { id: userFind._id, role: Role.User },
      process.env.JWT_Key,
      { expiresIn: "1h" },
    );
    if (tokenCreate) {
      res.json({
        side: `http://localhost:3000/#login?token=${tokenCreate}`,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Not redirect",
      });
    }
  } catch (error) {}
};

exports.delteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const delte = await loginModel.deleteOne({ _id: id });
    const delteManyNotes = await NotesModel.deleteMany({ userId: id });

    if (delte && delteManyNotes) {
      res.status(200).json({
        message: "User Deleted and Notes delted",
      });
    } else {
      res.status(400).json({
        message: "User Not Deleted",
      });
    }
  } catch (error) {}
};

exports.getUserAllUser = async (req, res) => {
  try {
    const data = await loginModel.find({});
    if (data.length > 0) {
      res.status(200).json({
        message: "User Found",
        data: data,
      });
    } else {
      res.status(400).json({
        message: "User Not Found",
      });
    }
  } catch (error) {}
};
