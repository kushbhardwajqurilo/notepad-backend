const app = require("./app");
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

require("dotenv").config();

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

const conversationModel = require("./src/model/conversatation");
const loginModel = require("./src/model/loginUser");
const {
  findSession,
  createSession,
  deleteSession,
} = require("./src/util/session");
const MessageModel = require("./src/model/chatModal");

const onlineUsers = new Map();

const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    if (value._id) {
      return String(value._id);
    }

    if (value.userId) {
      return String(value.userId);
    }
  }

  return String(value);
};

const isValidUserId = (value) =>
  Boolean(value) && mongoose.Types.ObjectId.isValid(normalizeId(value));

const normalizePath = (value) =>
  typeof value === "string" && value.trim() ? value.replace(/\\/g, "/") : null;

const getMessageDate = (message) =>
  message?.createdAt || message?.timestamp || message?.updatedAt || new Date();

const isUserOnline = (userId) =>
  (onlineUsers.get(normalizeId(userId)) || 0) > 0;

const markUserOnline = (userId) => {
  const normalizedUserId = normalizeId(userId);
  onlineUsers.set(
    normalizedUserId,
    (onlineUsers.get(normalizedUserId) || 0) + 1,
  );
};

const markUserOffline = (userId) => {
  const normalizedUserId = normalizeId(userId);
  const nextCount = (onlineUsers.get(normalizedUserId) || 0) - 1;

  if (nextCount > 0) {
    onlineUsers.set(normalizedUserId, nextCount);
    return;
  }

  onlineUsers.delete(normalizedUserId);
};

const getUnreadCount = (currentUser, otherUserId) => {
  if (!currentUser?.newMessages) {
    return 0;
  }

  if (typeof currentUser.newMessages.get === "function") {
    return Number(currentUser.newMessages.get(normalizeId(otherUserId)) || 0);
  }

  return Number(currentUser.newMessages?.[normalizeId(otherUserId)] || 0);
};

const formatConversationItem = ({
  otherUser,
  lastMessage,
  unreadCount,
  fallbackDate,
}) => {
  const userId = normalizeId(otherUser?._id);
  const displayName = otherUser?.name || otherUser?.username || "Unknown";
  const updatedAt = getMessageDate(lastMessage) || fallbackDate || new Date();

  return {
    id: userId,
    _id: userId,
    name: displayName,
    username: displayName,
    displayName,
    lastMessage: lastMessage?.message || "",
    updatedAt,
    timestamp: updatedAt,
    createdAt: updatedAt,
    newMessages: unreadCount,
    unread: unreadCount,
    isOnline: isUserOnline(userId),
  };
};

const formatMessage = (message) => {
  const from = normalizeId(
    message?.from || message?.senderId || message?.sender,
  );
  const to = normalizeId(
    message?.to || message?.receiverId || message?.receiver,
  );
  const createdAt = getMessageDate(message);

  return {
    _id: normalizeId(message?._id),
    message: message?.message || "",
    from,
    to,
    sender: from,
    attachment: normalizePath(message?.attachment),
    createdAt,
  };
};

const saveSocketAttachment = async (selectedFile, filePath) => {
  try {
    const normalizedFilePath = normalizePath(filePath);

    console.log("socket file =>", {
      filePath,
      normalizedFilePath,
      hasBuffer: Buffer.isBuffer(selectedFile),
      selectedFileType: typeof selectedFile,
    });

    // Existing uploaded file path
    if (
      normalizedFilePath &&
      (normalizedFilePath.startsWith("attachments/") ||
        normalizedFilePath.startsWith("uploads/"))
    ) {
      console.log("Using existing file path:", normalizedFilePath);
      return normalizedFilePath;
    }

    if (!selectedFile) {
      return normalizedFilePath || null;
    }

    let buffer = null;

    const candidateBuffer =
      selectedFile?.buffer || selectedFile?.data || selectedFile;

    if (Buffer.isBuffer(candidateBuffer)) {
      buffer = candidateBuffer;
    } else if (candidateBuffer instanceof ArrayBuffer) {
      buffer = Buffer.from(candidateBuffer);
    } else if (ArrayBuffer.isView(candidateBuffer)) {
      buffer = Buffer.from(
        candidateBuffer.buffer,
        candidateBuffer.byteOffset,
        candidateBuffer.byteLength,
      );
    } else if (typeof candidateBuffer === "string") {
      const rawValue = candidateBuffer.includes("base64,")
        ? candidateBuffer.split("base64,").pop()
        : candidateBuffer;

      try {
        const tempBuffer = Buffer.from(rawValue, "base64");

        if (tempBuffer.length > 0) {
          buffer = tempBuffer;
        } else {
          buffer = Buffer.from(candidateBuffer);
        }
      } catch (err) {
        buffer = Buffer.from(candidateBuffer);
      }
    } else if (Array.isArray(candidateBuffer)) {
      buffer = Buffer.from(candidateBuffer);
    }

    // No valid buffer found
    if (!buffer || !buffer.length) {
      console.log("No valid buffer found");

      if (normalizedFilePath) {
        return normalizedFilePath;
      }

      return selectedFile?.name ? normalizePath(selectedFile.name) : null;
    }

    const attachmentsDir = path.join(process.cwd(), "public", "attachments");

    await fs.mkdir(attachmentsDir, { recursive: true });

    const originalName =
      selectedFile?.name || selectedFile?.filename || filePath || "file.bin";

    let extension = path.extname(originalName);

    if (!extension) {
      extension = ".bin";
    }

    const savedFilename = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${extension}`;

    const fullPath = path.join(attachmentsDir, savedFilename);

    await fs.writeFile(fullPath, buffer);

    console.log("Attachment saved:", fullPath);

    return `https://4frnn03l-3000.inc1.devtunnels.ms/attachments/${savedFilename}`;
  } catch (error) {
    console.error("saveSocketAttachment error:", error);
    return null;
  }
};

const buildConversationList = async (currentUserId) => {
  const [currentUser, conversations] = await Promise.all([
    loginModel.findById(currentUserId),
    conversationModel
      .find({ participants: currentUserId })
      .populate({ path: "participants", select: "name" })
      .populate({
        path: "message",
        select:
          "message sender receiver from to attachment createdAt timestamp",
      })
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  return conversations
    .map((conversation) => {
      const otherUser = conversation.participants.find(
        (participant) =>
          normalizeId(participant?._id) !== normalizeId(currentUserId),
      );

      if (!otherUser) {
        return null;
      }

      const messages = Array.isArray(conversation.message)
        ? conversation.message
        : [];
      const lastMessage = messages[messages.length - 1] || null;

      return formatConversationItem({
        otherUser,
        lastMessage,
        unreadCount: getUnreadCount(currentUser, otherUser._id),
        fallbackDate: conversation.updatedAt,
      });
    })
    .filter(Boolean)
    .sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
    );
};

const buildUserList = async (currentUserId) => {
  const [currentUser, allUsers, conversations] = await Promise.all([
    loginModel.findById(currentUserId),
    loginModel
      .find({}, { name: 1, _id: 1, createdAt: 1, updatedAt: 1 })
      .sort({ createdAt: -1 })
      .lean(),
    conversationModel
      .find({ participants: currentUserId })
      .populate({ path: "participants", select: "name" })
      .populate({
        path: "message",
        select:
          "message sender receiver from to attachment createdAt timestamp",
      })
      .lean(),
  ]);

  const conversationSummaryByUserId = new Map();

  conversations.forEach((conversation) => {
    const otherUser = conversation.participants.find(
      (participant) =>
        normalizeId(participant?._id) !== normalizeId(currentUserId),
    );

    if (!otherUser) {
      return;
    }

    const messages = Array.isArray(conversation.message)
      ? conversation.message
      : [];
    const lastMessage = messages[messages.length - 1] || null;

    conversationSummaryByUserId.set(
      normalizeId(otherUser._id),
      formatConversationItem({
        otherUser,
        lastMessage,
        unreadCount: getUnreadCount(currentUser, otherUser._id),
        fallbackDate: conversation.updatedAt,
      }),
    );
  });

  return allUsers
    .filter((user) => normalizeId(user._id) !== normalizeId(currentUserId))
    .map((user) => {
      const userId = normalizeId(user._id);
      const summary = conversationSummaryByUserId.get(userId);
      const unreadCount = getUnreadCount(currentUser, userId);
      const updatedAt =
        summary?.updatedAt || user.updatedAt || user.createdAt || new Date();

      return {
        id: userId,
        _id: userId,
        name: user.name || "Unknown",
        username: user.name || "Unknown",
        displayName: user.name || "Unknown",
        lastMessage: summary?.lastMessage || "",
        updatedAt,
        timestamp: updatedAt,
        createdAt: updatedAt,
        newMessages: unreadCount,
        unread: unreadCount,
        isOnline: isUserOnline(userId),
      };
    })
    .sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt),
    );
};

const buildOnlineUsers = async (currentUserId) => {
  const allUsers = await buildUserList(currentUserId);
  return allUsers.filter((user) => user.isOnline);
};

const emitSidebarData = async (userId) => {
  const normalizedUserId = normalizeId(userId);
  if (!normalizedUserId) {
    return;
  }

  const [users, conversations, onlineOnlyUsers] = await Promise.all([
    buildUserList(normalizedUserId),
    buildConversationList(normalizedUserId),
    buildOnlineUsers(normalizedUserId),
  ]);

  io.to(normalizedUserId).emit("users", users);
  io.to(normalizedUserId).emit("messageList", conversations);
  io.to(normalizedUserId).emit("getOnlineUsers", onlineOnlyUsers);
};

const emitSidebarDataForUsers = async (userIds) => {
  const uniqueUserIds = [...new Set(userIds.map(normalizeId).filter(Boolean))];
  await Promise.all(uniqueUserIds.map((userId) => emitSidebarData(userId)));
};

const emitSidebarDataForAllConnectedUsers = async () => {
  const connectedUserIds = [...onlineUsers.keys()];
  await emitSidebarDataForUsers(connectedUserIds);
};

io.use(async (socket, next) => {
  try {
    const auth = socket.handshake.auth || {};
    const sessionID = normalizeId(auth.sessionID);

    let decodedToken = null;
    if (auth.token) {
      decodedToken = jwt.verify(auth.token, process.env.JWT_Key);
    }

    if (sessionID) {
      const existingSession = await findSession(sessionID);
      if (existingSession) {
        socket.sessionID = normalizeId(existingSession._id || sessionID);
        socket.userID = normalizeId(existingSession.userId);
        socket.username =
          existingSession.username ||
          auth.name ||
          auth.username ||
          decodedToken?.name ||
          "";

        return next();
      }
    }

    const resolvedUserId = normalizeId(
      auth.userId || auth.userID || decodedToken?.id || decodedToken?.userId,
    );
    const resolvedName = auth.name || auth.username || decodedToken?.name;

    if (!isValidUserId(resolvedUserId) || !resolvedName) {
      return next(new Error("invalid auth payload"));
    }

    const session = await createSession(resolvedName, resolvedUserId);
    socket.sessionID = normalizeId(session?._id);
    socket.userID = normalizeId(session?.userId || resolvedUserId);
    socket.username = session?.username || resolvedName;

    next();
  } catch (error) {
    next(new Error("invalid token"));
  }
});

io.on("connection", async (socket) => {
  markUserOnline(socket.userID);
  socket.join(socket.userID);

  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  await emitSidebarData(socket.userID);
  await emitSidebarDataForAllConnectedUsers();

  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    id: socket.userID,
    username: socket.username,
    name: socket.username,
    connected: true,
    isOnline: true,
  });

  socket.on("messageList", async () => {
    try {
      socket.emit("messageList", await buildConversationList(socket.userID));
    } catch (error) {
      console.error("Error fetching messageList:", error);
      socket.emit("error", { message: "Failed to fetch conversations" });
    }
  });

  socket.on("getOnlineUsers", async () => {
    try {
      socket.emit("getOnlineUsers", await buildOnlineUsers(socket.userID));
    } catch (error) {
      console.error("Error fetching getOnlineUsers:", error);
      socket.emit("error", { message: "Failed to fetch online users" });
    }
  });

  socket.on("messages", async (payload) => {
    try {
      const targetUserId = normalizeId(
        typeof payload === "object"
          ? payload?.to || payload?.userId || payload?._id
          : payload,
      );

      if (!isValidUserId(targetUserId)) {
        return socket.emit("error", { message: "Target user ID is required" });
      }

      let conversation = await conversationModel
        .findOne({
          participants: { $all: [socket.userID, targetUserId] },
        })
        .populate({
          path: "message",
          select:
            "message sender receiver from to attachment createdAt timestamp",
        })
        .lean();

      if (!conversation) {
        conversation = await conversationModel.create({
          participants: [socket.userID, targetUserId],
          message: [],
        });

        conversation = await conversationModel
          .findById(conversation._id)
          .lean();
      }

      await loginModel.findByIdAndUpdate(socket.userID, {
        $set: { [`newMessages.${targetUserId}`]: 0 },
      });

      const formattedMessages = (conversation.message || [])
        .map((message) => formatMessage(message))
        .sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
        );

      socket.emit("messages", formattedMessages);
      await emitSidebarData(socket.userID);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", { message: "Failed to fetch messages" });
    }
  });

  socket.on("private message", async (payload = {}) => {
    try {
      const to = normalizeId(payload.to);
      const messageText =
        typeof payload.message === "string" ? payload.message.trim() : "";

      if (!isValidUserId(to)) {
        return socket.emit("error", {
          message: "Recipient user ID is required",
        });
      }

      const attachment = await saveSocketAttachment(
        payload.selectedFile,
        payload.filePath,
      );

      if (!messageText && !attachment) {
        return socket.emit("error", {
          message: "Message content or attachment is required",
        });
      }

      let conversation = await conversationModel.findOne({
        participants: { $all: [socket.userID, to] },
      });

      if (!conversation) {
        conversation = await conversationModel.create({
          participants: [socket.userID, to],
          message: [],
        });
      }

      const newMessage = await MessageModel.create({
        sender: socket.userID,
        receiver: to,
        from: socket.userID,
        to,
        senderId: socket.userID,
        receiverId: to,
        message: messageText,
        attachment,
        read: false,
        timestamp: new Date(),
      });

      await conversationModel.findByIdAndUpdate(conversation._id, {
        $push: { message: newMessage._id },
        $set: { updatedAt: new Date() },
      });

      await loginModel.findByIdAndUpdate(to, {
        $inc: { [`newMessages.${socket.userID}`]: 1 },
      });

      const savedMessage = await MessageModel.findById(newMessage._id).lean();
      const formattedMessage = formatMessage(savedMessage);

      io.to(socket.userID).emit("private message", formattedMessage);
      io.to(to).emit("private message", formattedMessage);

      await emitSidebarDataForUsers([socket.userID, to]);
    } catch (error) {
      console.error("Error sending private message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", async (payload = {}) => {
    try {
      const to = normalizeId(
        typeof payload === "object" ? payload.to || payload.userId : payload,
      );

      if (!isValidUserId(to)) {
        return socket.emit("error", { message: "Target user ID is required" });
      }

      io.to(to).emit("typing", { from: socket.userID });
    } catch (error) {
      console.error("Error sending typing event:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      markUserOffline(socket.userID);
      await deleteSession(socket.sessionID);

      if (!isUserOnline(socket.userID)) {
        socket.broadcast.emit("user disconnected", socket.userID);
      }

      await emitSidebarDataForAllConnectedUsers();
    } catch (error) {
      console.error("Error handling socket disconnect:", error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
