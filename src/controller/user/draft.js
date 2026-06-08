const draftModel = require("../../model/draftModel");

exports.draftData = async (req, res) => {
  try {
    console.log("draft data post", req.body);
    const data = req.body;
    const userId = req.user.id;
    const objData = {
      content: data.content,
      isDrafy: true,
      userId: req.user.id,
    };
    const draftData = await draftModel.findOne({ userId: userId });
    if (draftData) {
      await draftModel.updateOne(
        { userId: userId },
        { $set: { content: data.content } },
      );
    } else {
      await draftModel.create(objData);
      res.json({
        status: "success",
        message: "Draft created successfully",
        data: objData,
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.draftDataGet = async (req, res) => {
  try {
    console.log(req.user.id);
    const draftData = await draftModel.findOne({ userId: req.user.id });
    console.log(draftData);
    if (draftData) {
      res.json({
        status: "success",
        message: "Draft get successfully",
        data: draftData,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Draft not get",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};

exports.deleteDraft = async (req, res) => {
  try {
    const id = req.user.id;
    const deleteData = await draftModel.deleteOne({ userId: id });
    if (deleteData) {
      res.json({
        status: "success",
        message: "Draft deleted successfully",
        data: deleteData,
      });
    } else {
      res.status(400).json({
        status: "failed",
        message: "Draft not deleted",
      });
    }
  } catch (error) {
    res.status(501).json({
      message: "Internal Server Error",
    });
  }
};
