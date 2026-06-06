const express = require('express')
const { getNotesUserName, getAllUserNote, adminGetAllUserNote } = require('../controller/manager/exisNote')
const { loginAdmin, signUpAdmin } = require('../controller/manager/auth')
const { registerUser, ManagerLoginUser, delteUser } = require('../controller/user/auth')
const { getAllMessagesManager, getAllUserChatNameManager } = require('../controller/manager/chatGet')

const AdminRoute = express.Router()



AdminRoute.post('/login',loginAdmin)
AdminRoute.post('/register',signUpAdmin)
AdminRoute.post('/userregister',registerUser)
AdminRoute.get('/redirect/:id',ManagerLoginUser)
AdminRoute.get('/notename',getNotesUserName)
AdminRoute.get('/getnote/:id',getAllUserNote)
AdminRoute.get('/getallnote',adminGetAllUserNote)
AdminRoute.delete("/deleteuser/:id",delteUser)
AdminRoute.get('/alluser',getAllUserChatNameManager)
AdminRoute.get('/allmessages/:receiver',getAllMessagesManager)

module.exports = AdminRoute