const server = require("../..");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();

// const { InMemoryMessageStore } = require("./messageStore");
const conversationModel = require("../model/conversatation");
const { createSession,findSession } = require("../util/session");
const { log } = require("console");
// const messageStore = new InMemoryMessageStore();

io.use(async(socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = await findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }
  const {username,userId} = socket.handshake.auth;
  if (!username) {
    return next(new Error("invalid username"));
  }
  const session=await createSession(username,userId)
  socket.sessionID = session?._id;
  socket.userID = session.userId;
  socket.username = session.username;
  next();
});

io.on("connection", async(socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);
  
  // fetch existing users
  
  const user=await loginModel.findById(req.user.id);
  const contacts = await loginModel.find({}, { name: 1, _id: 1 }).sort({createdAt:-1})
   const users=contacts.map(contact=>(
    {
       _id:contact._id,
       name:contact.name,
       newMessages:user.newMessages.get(contact._id.toString())||0,
   }))
  // const users = [];

  // const messagesPerUser = new Map();
  // messageStore.findMessagesForUser(socket.userID).forEach((message) => {
  //   const { from, to } = message;
  //   const otherUser = socket.userID === from ? to : from;
  //   if (messagesPerUser.has(otherUser)) {
  //     messagesPerUser.get(otherUser).push(message);
  //   } else {
  //     messagesPerUser.set(otherUser, [message]);
  //   }
  // });
  // sessionStore.findAllSessions().forEach((session) => {
  //   users.push({
  //     userID: session.userID,
  //     username: session.username,
  //     connected: session.connected,
  //     messages: messagesPerUser.get(session.userID) || [],
  //   });
  // });
   socket.emit("users", users);
   
  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    messages: [],
  });

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("private message", ({ content, to }) => {
    const message = {
      content,
      from: socket.userID,
      to,
    };
    // console.log(message);
    socket.to(to).to(socket.userID).emit("private message", message);
    messageStore.saveMessage(message);
  });
  socket.on("messages", async({ to }) => {
    const from=socket.userID;
    // const message = {
    //   content,
    //   from: socket.userID,
    //   to,
    // };
 
		const senderId = req.user.id;
        console.log(senderId, userToChatId)

		const conversation = await conversationModel.findOne({
			participants: { $all: [to, from] },
		}).populate({path:'message',model:MessageModel,select:'message'}); 
		
	    console.log(conversation,"conversation")


    socket.to(to).to(socket.userID).emit("messages", conversation.messages);
    // messageStore.saveMessage(message);
  });


  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
  });
});


