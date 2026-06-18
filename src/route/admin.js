const express = require("express");
const {
  getNotesUserName,
  getAllUserNote,
  adminGetAllUserNote,
} = require("../controller/manager/exisNote");
const { loginAdmin, signUpAdmin } = require("../controller/manager/auth");
const {
  registerUser,
  ManagerLoginUser,
  delteUser,
} = require("../controller/user/auth");
const {
  getAllMessagesManager,
  getAllUserChatNameManager,
} = require("../controller/manager/chatGet");
const {
  addIp,
  getAllIP,
  deleteIP,
  activeDeactiveAllIPs,
  IPGlobaleStatus,
  SingleIPBlockUnblock,
  getConversationMessages,
  updateUsernameAndPassword,
  getUsernameAndPassword,
} = require("../controller/admin/adminController");
const { IPAccessMiddleware } = require("../middleware/IpAccessMiddleware");
const { getAllConversations } = require("../controller/admin/adminController");

const AdminRoute = express.Router();

AdminRoute.post("/login", loginAdmin);
AdminRoute.post("/register", signUpAdmin);
AdminRoute.post("/userregister", registerUser);
AdminRoute.get("/redirect/:id", ManagerLoginUser);
AdminRoute.get("/notename", getNotesUserName);
AdminRoute.get("/getnote/:id", getAllUserNote);
AdminRoute.get("/getallnote", adminGetAllUserNote);
AdminRoute.delete("/deleteuser/:id", delteUser);
AdminRoute.get("/alluser", getAllUserChatNameManager);
AdminRoute.get("/allmessages/:receiver", getAllMessagesManager);
AdminRoute.post("/block-ip", addIp);
AdminRoute.get("/blocked-ips", getAllIP);
AdminRoute.delete("/blocked-ip/:id", deleteIP);
AdminRoute.post("/toggle-security", activeDeactiveAllIPs);
AdminRoute.get("/security-status", IPGlobaleStatus);
AdminRoute.put("/blocked-ip/:id", SingleIPBlockUnblock);

AdminRoute.get("/conversation", getAllConversations);
AdminRoute.get("/get-conversation/:id", getConversationMessages);

AdminRoute.put("/user-credential/:id", updateUsernameAndPassword);
module.exports = AdminRoute;
