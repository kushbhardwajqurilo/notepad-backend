const NotesModel = require("../../model/notes");

exports.addNotes = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const ObjData = {
      title: data.title,
      content: data.content,
      userId: req.user.id,
      updateStatus: false,
    };

    const dataCreate = await NotesModel.create(ObjData);
    if (dataCreate) {
      res.json({
        status: "success",
        message: "Notes Created",
      });
    } else {
      res.status(400).json({
        message: "Notes Not Created",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Surver Error",
    });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const user = req.user.id;
    console.log("user", user);
    const notes = await NotesModel.find({ userId: user });
    if (notes.length > 0) {
      res.status(200).json({
        message: "Notes retrieved successfully",
        data: notes,
      });
    } else {
      res.status(200).json({
        status: "success",
        data: [],
      });
    }
    console.log("notes", notes);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.viewNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await NotesModel.findOne({ _id: noteId });

    if (note) {
      res.status(200).json({
        message: "Note retrieved successfully",
        data: note,
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const updatedData = req.body;

    const objData = {
      title: updatedData.title,
      content: updatedData.content,
      updateStatus: true,
    };

    const note = await NotesModel.findByIdAndUpdate(noteId, objData, {
      new: true,
    });

    if (note) {
      res.json({
        status: "success",
        message: "update Note successfully",
        data: note,
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await NotesModel.findByIdAndDelete(noteId);

    if (note) {
      res.json({
        status: "success",
        message: "Note deleted successfully",
      });
    } else {
      res.status(404).json({
        message: "Note not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.findNotes = async (req, res) => {
  try {
    const data = req.params.data;

    const findContent = await NotesModel.find({
      content: { $regex: data, $options: "i" },
      userId: req.user.id,
    });
    if (findContent) {
      res.json({
        status: "success",
        message: "Note found successfully",
        data: findContent,
      });
    } else {
      res.json({
        status: "failed",
        message: "Note not found",
      });
    }
  } catch (error) {}
};

exports.getBackupNotes = async (req, res) => {
  try {
    const notes = await NotesModel.find({});
    if (notes.length > 0) {
      res.status(200).json({
        message: "Notes retrieved successfully",
        data: notes,
      });
    } else {
      res.status(400).json({
        message: "Notes Not retrieved",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
