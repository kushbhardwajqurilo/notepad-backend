const app = require("./app");
const http = require("http");
// const fileType = require('file-type');
require("dotenv").config();


const server = http.createServer(app);
//create socket io server
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// const uploadBase64Image = require('./src/util/base64')


const conversationModel = require("./src/model/conversatation");
const loginModel = require("./src/model/loginUser");
const {
  findSession,
  createSession,
  deleteSession,
} = require("./src/util/session");
const MessageModel = require("./src/model/chatModal");
const { default: mongoose } = require("mongoose");

const path = require("path");
const getContacts=async(userId)=>{
  const user = await loginModel.findById(userId);
  // Fetch existing users
  const userList = await loginModel
    .find({}, { name: 1, _id: 1 })
    .sort({ createdAt: -1 });
  const contacts = userList
    .filter((contact) => contact._id.toString() !== userId.toString())
    .map((contact) => ({
      _id: contact._id,
      name: contact.name,
      newMessages: user?.newMessages.get(contact._id.toString()) || 0,
    }));
    return contacts;
}
const users = {}; // A map to store user IDs and their corresponding socket IDs
//Io middleware
io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = await findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userId;
      socket.username = session.username;
      console.log(socket.id,"id");
      users[socket.userID] = socket.id; // Store the user ID and socket ID
      return next();
    }
  }
  const { username, userId } = socket.handshake.auth;
  if (!username) {
    return next(new Error("invalid username"))
  }
  const session = await createSession(username, userId);
  socket.sessionID = session?._id;
  socket.userID = session?.userId;
  socket.username = session?.username;
  users[socket.userID] = socket.id; 
  console.log(socket,"id");// Store the user ID and socket ID
  next();
});

io.on("connection", async (socket) => {
  // Emit session details
  console.log("user connected");
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // Join the "userID" room
  socket.join(socket.userID);
  const contacts=await getContacts(socket.userID);

  socket.emit("users", contacts);

  // Notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    messages: [],
  });

  // Forward the private message to the right recipient
  socket.on("private message", async ({ message,selectedFile,filePath,to }) => {
    console.log(selectedFile);
    let filename;
    if(selectedFile){
    const base64String = Buffer.from(selectedFile).toString('base64')||null;
    // const type = await fileType.fromBuffer(buffer);
    // const mimeType=type.mime;
    const mimeType = 'image/' + path.extname(filePath).slice(1);
    console.log(base64String,"base64")
    const base64Image=`data:${mimeType};base64,${base64String}`;
    filename= null
    // filename= uploadBase64Image(base64Image)||null;
  }
    const from = socket.userID;
    const data = {
      sender: from,
      receiver: to,
      message: message,
      attachment: filename,
      read: false,
    };
   
    let conversation = await conversationModel.findOne({
      participants: { $all: [to, from] },
    });
    if (!conversation) {
      const newConversation = await conversationModel.create({
        participants: [from, to],
        messages: [], // Initialize messages array
      });
      conversation = newConversation;
    }

    const newMessage = await MessageModel.create(data);
    conversation.message.push(newMessage._id);
    await conversation.save();
    const user= await loginModel.findOneAndUpdate(
      { _id: to },
      { $inc: { [`newMessages.${socket.userID}`]: 1 } },
      { new: true }
    );
    const contacts=await getContacts(to);

    // Emit the message to the recipient
    const toSocketID = users[to];
    
    if (toSocketID) {
     
      io.to(toSocketID).emit("private message", newMessage);
       io.to(toSocketID).emit("users",contacts);
    }

    // Emit the message to the sender for confirmation
     socket.emit("private message", newMessage);
  });

  // Get Selected User Messages
  socket.on("messages", async (to) => {
    const from = socket.userID;
    const senderId = new mongoose.Types.ObjectId(to);
    console.log(from, senderId);
    const conversation = await conversationModel
      .findOne({
        participants: { $all: [from, senderId] },
      })
      .populate("message");
    //  console.log(conversation,"conversation")

    const user = await loginModel.findById(socket.userID);
    if(!user) return;
    user?.newMessages.set(to, 0);
    await user.save();

    const contacts=await getContacts(socket.userID);
    socket.emit("users", contacts);
    socket.emit("messages", conversation?.message || []);
  });

  // Notify users upon disconnection
  socket.on("disconnect", async () => {
    delete users[socket.userID]; // Remove the user from the map
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      console.log("User disconnected: ", socket.userID);
      await deleteSession(socket.sessionID);
      socket.broadcast.emit("user disconnected", socket.userID);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
