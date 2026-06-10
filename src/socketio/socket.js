// const server = require("../..");

// const io = require("socket.io")(server, {
//   cors: {
//     origin: "*",
//   },
// });

// const crypto = require("crypto");
// const randomId = () => crypto.randomBytes(8).toString("hex");

// const { InMemorySessionStore } = require("./sessionStore");
// const sessionStore = new InMemorySessionStore();

// // const { InMemoryMessageStore } = require("./messageStore");
// const conversationModel = require("../model/conversatation");
// const { createSession, findSession } = require("../util/session");
// const { log } = require("console");
// // const messageStore = new InMemoryMessageStore();

// io.use(async (socket, next) => {
//   const sessionID = socket.handshake.auth.sessionID;
//   if (sessionID) {
//     const session = await findSession(sessionID);
//     if (session) {
//       socket.sessionID = sessionID;
//       socket.userID = session.userID;
//       socket.username = session.username;
//       return next();
//     }
//   }
//   const { username, userId } = socket.handshake.auth;
//   if (!username) {
//     return next(new Error("invalid username"));
//   }
//   const session = await createSession(username, userId);
//   socket.sessionID = session?._id;
//   socket.userID = session.userId;
//   socket.username = session.username;
//   next();
// });

// io.on("connection", async (socket) => {
//   // persist session
//   sessionStore.saveSession(socket.sessionID, {
//     userID: socket.userID,
//     username: socket.username,
//     connected: true,
//   });

//   // emit session details
//   socket.emit("session", {
//     sessionID: socket.sessionID,
//     userID: socket.userID,
//   });

//   // join the "userID" room
//   socket.join(socket.userID);

//   // fetch existing users

//   const user = await loginModel.findById(req.user.id);
//   const contacts = await loginModel
//     .find({}, { name: 1, _id: 1 })
//     .sort({ createdAt: -1 });
//   const users = contacts.map((contact) => ({
//     _id: contact._id,
//     name: contact.name,
//     newMessages: user.newMessages.get(contact._id.toString()) || 0,
//   }));
//   // const users = [];

//   // const messagesPerUser = new Map();
//   // messageStore.findMessagesForUser(socket.userID).forEach((message) => {
//   //   const { from, to } = message;
//   //   const otherUser = socket.userID === from ? to : from;
//   //   if (messagesPerUser.has(otherUser)) {
//   //     messagesPerUser.get(otherUser).push(message);
//   //   } else {
//   //     messagesPerUser.set(otherUser, [message]);
//   //   }
//   // });
//   // sessionStore.findAllSessions().forEach((session) => {
//   //   users.push({
//   //     userID: session.userID,
//   //     username: session.username,
//   //     connected: session.connected,
//   //     messages: messagesPerUser.get(session.userID) || [],
//   //   });
//   // });
//   socket.emit("users", users);

//   // notify existing users
//   socket.broadcast.emit("user connected", {
//     userID: socket.userID,
//     username: socket.username,
//     connected: true,
//     messages: [],
//   });

//   // forward the private message to the right recipient (and to other tabs of the sender)
//   socket.on("private message", ({ content, to }) => {
//     const message = {
//       content,
//       from: socket.userID,
//       to,
//     };
//     // console.log(message);
//     socket.to(to).to(socket.userID).emit("private message", message);
//     messageStore.saveMessage(message);
//   });
//   socket.on("messages", async ({ to }) => {
//     const from = socket.userID;
//     // const message = {
//     //   content,
//     //   from: socket.userID,
//     //   to,
//     // };

//     const senderId = req.user.id;
//     // console.log(senderId, userToChatId)

//     const conversation = await conversationModel
//       .findOne({
//         participants: { $all: [to, from] },
//       })
//       .populate({ path: "message", model: MessageModel, select: "message" });

//     // console.log(conversation,"conversation")

//     socket.to(to).to(socket.userID).emit("messages", conversation.messages);
//     // messageStore.saveMessage(message);
//   });

//   // notify users upon disconnection
//   socket.on("disconnect", async () => {
//     const matchingSockets = await io.in(socket.userID).allSockets();
//     const isDisconnected = matchingSockets.size === 0;
//     if (isDisconnected) {
//       // notify other users
//       socket.broadcast.emit("user disconnected", socket.userID);
//       // update the connection status of the session
//       sessionStore.saveSession(socket.sessionID, {
//         userID: socket.userID,
//         username: socket.username,
//         connected: false,
//       });
//     }
//   });
// });

const server = require("../..");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

// ============================================
// IMPORT YOUR MODELS
// ============================================
const conversationModel = require("../model/conversation");
const messageModel = require("../model/message"); // Import message model
const userModel = require("../model/user"); // Import user model (or loginModel)
const { createSession, findSession } = require("../util/session");

// ============================================
// SESSION STORE
// ============================================
class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }

  findSession(id) {
    return this.sessions.get(id);
  }

  saveSession(id, session) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return Array.from(this.sessions.values());
  }
}

const sessionStore = new InMemorySessionStore();

// ============================================
// SOCKET.IO MIDDLEWARE - AUTHENTICATION
// ============================================
io.use(async (socket, next) => {
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

  // New user - create session
  const { username, userId } = socket.handshake.auth;
  if (!username || !userId) {
    return next(new Error("Invalid username or userId"));
  }

  const session = await createSession(username, userId);
  socket.sessionID = session?._id;
  socket.userID = session?.userId;
  socket.username = session?.username;
  next();
});

// ============================================
// SOCKET.IO CONNECTION
// ============================================
io.on("connection", async (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userID})`);

  // Save session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // Emit session details to client
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // Join user-specific room
  socket.join(socket.userID);

  // ============================================
  // EVENT: messageList
  // Fetch all conversations for the current user
  // ============================================
  socket.on("messageList", async () => {
    try {
      const conversations = await conversationModel
        .find({ participants: socket.userID })
        .populate({
          path: "message",
          select: "message from to createdAt",
          options: { limit: 1, sort: { createdAt: -1 } }, // Get last message
        })
        .populate({
          path: "participants",
          select: "_id username name email avatar",
        })
        .sort({ updatedAt: -1 })
        .lean();

      // Format for frontend
      const formattedConversations = conversations.map((conv) => {
        // Find the other participant (not current user)
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== socket.userID,
        );

        const lastMsg = conv.message[0];

        return {
          id: otherUser?._id || "",
          _id: otherUser?._id || "",
          name: otherUser?.username || otherUser?.name || "Unknown",
          username: otherUser?.username || "",
          avatar: otherUser?.avatar || null,
          lastMessage: lastMsg?.message || "",
          updatedAt: lastMsg?.createdAt || conv.updatedAt,
          newMessages: 0, // Track in database if needed
          isOnline: this.checkIfOnline(otherUser?._id),
        };
      });

      socket.emit("messageList", formattedConversations);
    } catch (error) {
      console.error("Error fetching messageList:", error);
      socket.emit("error", { message: "Failed to fetch conversations" });
    }
  });

  // ============================================
  // EVENT: getOnlineUsers
  // Fetch all online users
  // ============================================
  socket.on("getOnlineUsers", async () => {
    try {
      const sessions = sessionStore.findAllSessions();

      const users = sessions
        .filter((session) => session.userID !== socket.userID) // Exclude current user
        .map((session) => ({
          id: session.userID,
          _id: session.userID,
          name: session.username,
          username: session.username,
          isOnline: session.connected,
        }));

      socket.emit("getOnlineUsers", users);
    } catch (error) {
      console.error("Error fetching online users:", error);
      socket.emit("error", { message: "Failed to fetch online users" });
    }
  });

  // ============================================
  // EVENT: messages
  // Fetch all messages between current user and target user
  // ============================================
  socket.on("messages", async (data) => {
    try {
      const targetUserId = data.to || data; // Handle both object and string

      if (!targetUserId) {
        return socket.emit("error", { message: "Target user ID is required" });
      }

      // Find or create conversation
      let conversation = await conversationModel
        .findOne({
          participants: { $all: [socket.userID, targetUserId] },
        })
        .populate({
          path: "message",
          select:
            "message from to sender senderId receiverId createdAt _id attachment",
          populate: [
            { path: "senderId", select: "username name _id" },
            { path: "receiverId", select: "username name _id" },
          ],
        })
        .populate({
          path: "participants",
          select: "_id username name avatar",
        })
        .lean();

      // If no conversation exists, create one
      if (!conversation) {
        conversation = await conversationModel.create({
          participants: [socket.userID, targetUserId],
          message: [],
        });

        conversation = await conversationModel
          .findById(conversation._id)
          .populate({
            path: "message",
            select:
              "message from to sender senderId receiverId createdAt _id attachment",
          })
          .populate({
            path: "participants",
            select: "_id username name avatar",
          })
          .lean();
      }

      // Format messages for frontend
      const formattedMessages = (conversation.message || []).map((msg) => ({
        _id: msg._id,
        message: msg.message,
        from: msg.from || msg.senderId?._id || msg.sender,
        to: msg.to || msg.receiverId?._id,
        sender: msg.sender || msg.senderId?._id,
        attachment: msg.attachment || null,
        createdAt: msg.createdAt,
        senderDetails: msg.senderId || null,
      }));

      socket.emit("messages", formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", { message: "Failed to fetch messages" });
    }
  });

  // ============================================
  // EVENT: private message
  // Save and send private message between two users
  // ============================================
  socket.on("private message", async (payload) => {
    try {
      const {
        message: messageText,
        to,
        selectedFile,
        filePath,
        sender,
      } = payload;

      if (!to || !messageText) {
        return socket.emit("error", {
          message: "Message content and recipient required",
        });
      }

      // Create message document
      const newMessage = await messageModel.create({
        message: messageText,
        from: socket.userID,
        to: to,
        sender: socket.userID,
        senderId: socket.userID,
        receiverId: to,
        attachment: filePath || null,
      });

      // Get populated message
      const populatedMessage = await messageModel
        .findById(newMessage._id)
        .populate("senderId", "username name avatar")
        .populate("receiverId", "username name avatar")
        .lean();

      // Find or create conversation
      let conversation = await conversationModel.findOne({
        participants: { $all: [socket.userID, to] },
      });

      if (!conversation) {
        conversation = await conversationModel.create({
          participants: [socket.userID, to],
          message: [newMessage._id],
        });
      } else {
        // Add message to conversation
        await conversationModel.findByIdAndUpdate(conversation._id, {
          $push: { message: newMessage._id },
        });
      }

      // Format message for emission
      const messageToEmit = {
        _id: populatedMessage._id,
        message: populatedMessage.message,
        from: populatedMessage.from,
        to: populatedMessage.to,
        sender: populatedMessage.sender,
        attachment: populatedMessage.attachment,
        createdAt: populatedMessage.createdAt,
        senderDetails: populatedMessage.senderId,
      };

      // Send to both users (sender and receiver)
      io.to(socket.userID).to(to).emit("private message", messageToEmit);

      console.log(`Message from ${socket.username} to ${to}: ${messageText}`);
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ============================================
  // EVENT: typing
  // Notify when user is typing
  // ============================================
  socket.on("typing", async (data) => {
    try {
      const { to } = data;

      if (!to) {
        return socket.emit("error", { message: "Target user ID is required" });
      }

      // Send typing indicator to the target user
      io.to(to).emit("typing", {
        from: socket.userID,
        username: socket.username,
      });
    } catch (error) {
      console.error("Error in typing event:", error);
    }
  });

  // ============================================
  // EVENT: user connected
  // Broadcast user connection to all
  // ============================================
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
    isOnline: true,
  });

  // ============================================
  // EVENT: disconnect
  // Handle user disconnection
  // ============================================
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.username} (${socket.userID})`);

    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;

    if (isDisconnected) {
      // Notify other users
      socket.broadcast.emit("user disconnected", socket.userID);

      // Update session status
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
  });

  function checkIfOnline(userId) {
    const sessions = sessionStore.findAllSessions();
    return sessions.some(
      (session) => session.userID === userId?.toString() && session.connected,
    );
  }
});

module.exports = io;
