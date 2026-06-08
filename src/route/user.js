const express = require("express");
const {
  addNotes,
  getNotes,
  viewNote,
  updateNote,
  deleteNote,
  findNotes,
  getBackupNotes,
} = require("../controller/user/notes");
const {
  registerUser,
  loginUser,
  delteUser,
  getUserAllUser,
} = require("../controller/user/auth");
const { authmidleware } = require("../middleware/auth_middelware");
const {
  draftData,
  draftDataGet,
  deleteDraft,
} = require("../controller/user/draft");
const {
  addMessage,
  getAllUserChatName,
  getAllMessage,
} = require("../controller/user/chat");
const upload = require("../middleware/fileUpload");
const { addSaveDraft } = require("../controller/user/draftSaveData");
const { IPAccessMiddleware } = require("../middleware/IpAccessMiddleware");

const UserRoute = express.Router();

UserRoute.get("/allnotesbackup", getBackupNotes);
UserRoute.get("/logindetails", getUserAllUser);
//

UserRoute.post("/login", IPAccessMiddleware, loginUser);
UserRoute.post("/register", registerUser);
UserRoute.use(authmidleware);
UserRoute.get("/viewnote/:id", viewNote);
UserRoute.put("/updatenote/:id", updateNote);
UserRoute.delete("/deletenote/:id", deleteNote);
UserRoute.post("/message", upload.single("attachment"), addMessage);
UserRoute.post("/getmessage", getAllMessage);
UserRoute.post("/save-draft", addSaveDraft);
UserRoute.get("/search/:data", findNotes);
UserRoute.get("/getusername", getAllUserChatName);
UserRoute.post("/addnotes", addNotes);
UserRoute.get("/getNotes", getNotes);
UserRoute.post("/draft", draftData);
UserRoute.get("/draft", draftDataGet);
UserRoute.delete("/draft", deleteDraft);

module.exports = UserRoute;
