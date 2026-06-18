const express = require("express");
const {
  addNotes,
  getNotes,
  viewNote,
  updateNote,
  deleteNote,
  findNotes,
  getBackupNotes,
  addCredentialNote,
  updateCredentialNote,
  getCredentialNotes,
  viewCredentialNote,
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
  deleteDraftById,
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
UserRoute.put("/updatenote/:id", upload.array("attachments"), updateNote);
UserRoute.delete("/deletenote/:id", deleteNote);
UserRoute.post("/message", upload.single("attachment"), addMessage);
UserRoute.post("/getmessage", getAllMessage);
UserRoute.post("/save-draft", addSaveDraft);
UserRoute.get("/search/:data", findNotes);
UserRoute.get("/getusername", getAllUserChatName);
UserRoute.post("/addnotes", upload.array("attachments"), addNotes);
UserRoute.get("/getNotes", getNotes);
UserRoute.post("/draft", upload.array("attachments"), draftData);
UserRoute.get("/draft", draftDataGet);
UserRoute.delete("/draft", deleteDraft);
UserRoute.delete("/draft/:id", deleteDraftById);

// crentialNote rout
UserRoute.post(
  "/addcredentialnotes",
  upload.array("attachments"),
  addCredentialNote,
);
UserRoute.put(
  "/updatecredentialnote/:id",
  upload.array("attachments"),
  updateCredentialNote,
);
// UserRoute.get("/getcredentialNotes", getCredentialNotes);
UserRoute.get("/getcredentialnote", viewCredentialNote);
module.exports = UserRoute;
