const loginModel = require("../../model/loginUser");
const NotesModel = require("../../model/notes");

exports.getNotesUserName = async (req, res) => {
  try {
    const userName = await loginModel.find({}).sort({ createdAt: -1 });
    if (userName.length > 0) {
      res.status(200).json({
        message: "User Name Found",
        data: userName,
      });
    } else {
      res.status(400).json({
        message: "User Name Not Found",
        data: [],
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Server Error",
    });
  }
};

exports.getAllUserNote = async (req, res) => {
  try {
    const user = req.params.id;
    console.log(user, "user");
    const notes = await NotesModel.find({ userId: user });
    console.log(notes);
    if (notes.length > 0) {
      res.status(200).json({
        message: "Notes Found",
        data: notes,
      });
    } else {
      res.status(400).json({
        message: "Notes Not Found",
        data: [],
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Server Error",
    });
  }
};

exports.adminGetAllUserNote = async (req, res) => {
  try {
    const notes = await NotesModel.find({});
    if (notes.length > 0) {
      res.status(200).json({
        message: "Notes Found",
        data: notes,
      });
    } else {
      res.status(400).json({
        message: "Notes Not Found",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Server Error",
    });
  }
};
