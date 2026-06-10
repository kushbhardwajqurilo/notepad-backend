const conversationModel = require("../../model/conversatation");
const IpBlockModel = require("../../model/IPModel");

exports.addIp = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({
        status: "failed",
        message: "IP Missing",
      });
    }

    const ips = Array.isArray(ip) ? ip : [ip];
    const operations = ips.map((ipAddress) => ({
      updateOne: {
        filter: { ip: ipAddress },
        update: {
          $setOnInsert: {
            ip: ipAddress,
          },
        },
        upsert: true,
      },
    }));

    const result = await IpBlockModel.bulkWrite(operations);

    return res.status(200).json({
      status: "success",
      message: "IPs processed successfully",
      insertedCount: result.upsertedCount,
      existingCount: ips.length - result.upsertedCount,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message,
      error,
    });
  }
};
// get all IP's
exports.getAllIP = async (req, res) => {
  try {
    const IPs = await IpBlockModel.find({}).sort({ createdAt: -1 }).lean();
    if (!IPs) {
      return res.status(200).json({
        status: "success",
        message: "no IPs found",
        data: [],
      });
    }
    const filterIP = IPs.map((ip) => ({
      _id: ip?._id,
      ip: ip?.ip,
      isActive: ip?.isActive,
      createdAt: ip?.createdAt,
    }));
    return res.status(200).json({
      status: "success",
      message: "ip fateched",
      data: filterIP,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Something Went Wrong",
      error: error,
    });
  }
};

// delete ip
exports.deleteIP = async (req, res) => {
  try {
    const { id } = req?.params;

    console.log("ip id", id);
    if (!id) {
      return res.status(400).json({
        status: "failed",
        message: "Ip Missing",
      });
    }
    const removeIp = await IpBlockModel.deleteOne({ _id: id });
    if (removeIp.deletedCount === 0) {
      return res
        .status(400)
        .json({ status: "failed", messsage: "Failed to delete IP" });
    }
    return res.status(200).json({
      status: "success",
      message: "IP delete successfull",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error,
    });
  }
};

// active all ip active
exports.activeDeactiveAllIPs = async (req, res, next) => {
  try {
    const { status } = req?.body;
    const result = await IpBlockModel.updateMany({ isActive: !status });
    if (result.modifiedCount === 0) {
      return res.status(400).json({
        status: "failed",
        message: "failed to active",
      });
    }
    return res.status(201).json({
      status: "success",
      message: status ? "All IP's Blocked" : "All IP's Activated",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Internal Server Error",
      error: error,
    });
  }
};
exports.IPGlobaleStatus = async (req, res, next) => {
  try {
    const AllIp = await IpBlockModel.find({}, "isActive");
    if (!AllIp) {
      return res.status(201).json({
        status: "success",
        message: "",
        data: { isGlobalBlocked: null },
      });
    }
    const isActive = AllIp.every((val) => val?.isActive === false);
    return res.status(201).json({
      status: "success",
      message: "",
      data: { isGlobalBlocked: isActive },
    });
  } catch (err) {
    return res.status(500).json({
      status: "failed",
      message: "something went wrong",
    });
  }
};

// single ip blocked or unblocked
exports.SingleIPBlockUnblock = async (req, res, next) => {
  try {
    const { id } = req?.params;
    const { isActive } = req?.body;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "IP Id missing",
      });
    }
    const result = await IpBlockModel.updateOne(
      { _id: id },
      { $set: { isActive: isActive } },
    );
    if (result?.modifiedCount === 0) {
      return res.status(400).json({
        status: "failed",
        message: "Process Failed Try Again",
      });
    }
    return res.status(201).json({
      status: "success",
      message: isActive ? "IP Blocked" : "IP Activated",
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "something went wrong",
    });
  }
};

// conversation

// exports.getAllUserConversation = async (req, res) => {
//   try {
//     const conversations = await conversationModel
//       .aggregate([
//         // Participants
//         {
//           $lookup: {
//             from: "userlogins",
//             let: {
//               participantIds: "$participants",
//             },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $in: ["$_id", "$$participantIds"],
//                   },
//                 },
//               },
//               {
//                 $project: {
//                   _id: 1,
//                   name: 1,
//                 },
//               },
//             ],
//             as: "participantsData",
//           },
//         },

//         // Messages + sender + receiver in single lookup
//         {
//           $lookup: {
//             from: "messages",
//             let: {
//               messageIds: "$message",
//             },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $in: ["$_id", "$$messageIds"],
//                   },
//                 },
//               },

//               {
//                 $lookup: {
//                   from: "userlogins",
//                   localField: "senderId",
//                   foreignField: "_id",
//                   pipeline: [
//                     {
//                       $project: {
//                         _id: 1,
//                         name: 1,
//                         email: 1,
//                         role: 1,
//                       },
//                     },
//                   ],
//                   as: "sender",
//                 },
//               },

//               {
//                 $lookup: {
//                   from: "userlogins",
//                   localField: "receiverId",
//                   foreignField: "_id",
//                   pipeline: [
//                     {
//                       $project: {
//                         _id: 1,
//                         name: 1,
//                         email: 1,
//                         role: 1,
//                       },
//                     },
//                   ],
//                   as: "receiver",
//                 },
//               },

//               {
//                 $project: {
//                   _id: 1,
//                   message: 1,
//                   createdAt: 1,
//                   updatedAt: 1,

//                   sender: {
//                     $arrayElemAt: ["$sender", 0],
//                   },

//                   receiver: {
//                     $arrayElemAt: ["$receiver", 0],
//                   },
//                 },
//               },

//               {
//                 $sort: {
//                   createdAt: 1,
//                 },
//               },
//             ],
//             as: "messages",
//           },
//         },

//         {
//           $project: {
//             _id: 1,
//             message: 1,
//             createdAt: 1,
//             updatedAt: 1,

//             sender: {
//               _id: {
//                 $arrayElemAt: ["$sender._id", 0],
//               },
//               name: {
//                 $arrayElemAt: ["$sender.name", 0],
//               },
//               email: {
//                 $arrayElemAt: ["$sender.email", 0],
//               },
//               role: {
//                 $arrayElemAt: ["$sender.role", 0],
//               },
//             },

//             receiver: {
//               _id: {
//                 $arrayElemAt: ["$receiver._id", 0],
//               },
//               name: {
//                 $arrayElemAt: ["$receiver.name", 0],
//               },
//               email: {
//                 $arrayElemAt: ["$receiver.email", 0],
//               },
//               role: {
//                 $arrayElemAt: ["$receiver.role", 0],
//               },
//             },
//           },
//         },
//       ])
//       .allowDiskUse(true);

//     return res.status(200).json({
//       success: true,
//       totalConversations: conversations.length,
//       data: conversations,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.getAllUserConversation = async (req, res) => {
//   try {
//     const conversations = await conversationModel
//       .aggregate([
//         // Participants
//         {
//           $lookup: {
//             from: "userlogins",
//             let: {
//               participantIds: "$participants",
//             },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $in: ["$_id", "$$participantIds"],
//                   },
//                 },
//               },
//               {
//                 $project: {
//                   _id: 1,
//                   name: 1,
//                   email: 1,
//                   role: 1,
//                 },
//               },
//             ],
//             as: "participantsData",
//           },
//         },

//         // Messages
//         {
//           $lookup: {
//             from: "messages",
//             let: {
//               messageIds: "$message",
//             },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $in: ["$_id", "$$messageIds"],
//                   },
//                 },
//               },

//               // Sender User
//               {
//                 $lookup: {
//                   from: "userlogins",
//                   localField: "sender",
//                   foreignField: "_id",
//                   as: "sender",
//                 },
//               },

//               // Receiver User
//               {
//                 $lookup: {
//                   from: "userlogins",
//                   localField: "receiver",
//                   foreignField: "_id",
//                   as: "receiver",
//                 },
//               },

//               {
//                 $project: {
//                   _id: 1,
//                   message: 1,
//                   createdAt: 1,
//                   updatedAt: 1,

//                   sender: {
//                     _id: {
//                       $arrayElemAt: ["$sender._id", 0],
//                     },
//                   },

//                   receiver: {
//                     _id: {
//                       $arrayElemAt: ["$receiver._id", 0],
//                     },
//                   },
//                 },
//               },

//               {
//                 $sort: {
//                   createdAt: 1,
//                 },
//               },
//             ],
//             as: "messages",
//           },
//         },

//         {
//           $project: {
//             _id: 0,

//             conversationId: "$_id",

//             user1: {
//               $arrayElemAt: ["$participantsData", 0],
//             },

//             user2: {
//               $arrayElemAt: ["$participantsData", 1],
//             },

//             totalMessages: {
//               $size: "$messages",
//             },

//             messages: 1,

//             createdAt: 1,
//             updatedAt: 1,
//           },
//         },

//         {
//           $sort: {
//             updatedAt: -1,
//           },
//         },
//       ])
//       .allowDiskUse(true);

//     return res.status(200).json({
//       success: true,
//       totalConversations: conversations.length,
//       data: conversations,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// Best approach: Using populate with multiple levels
exports.getAllConversations = async (req, res) => {
  try {
    // Fetch all conversations with populated messages and participants
    const conversations = await conversationModel
      .find()
      .populate({
        path: "message",
        select: "sender receiver message createdAt updatedAt",
        populate: [
          {
            path: "sender",
            select: "name", // Adjust fields based on your userLogin schema
          },
          {
            path: "receiver",
            select: "name",
          },
        ],
      })
      .populate({
        path: "participants",
        select: "name _id",
      })
      .sort({ updatedAt: -1 }); // Most recent conversations first

    // Format the response for frontend
    const formattedConversations = conversations.map((conversation) => ({
      conversationId: conversation._id,
      participants: conversation.participants.map(
        (user) => (
          console.log("user", user),
          {
            userId: user._id,
            name: user.name,
            email: user.email,
          }
        ),
      ),
      participantNames: conversation.participants
        .map((user) => user.name)
        .join(" -- "),
      messages: conversation.message.map(
        (msg) => (
          console.log("msg", msg),
          {
            messageId: msg._id,
            sender: {
              userId: msg.sender?._id,
              name: msg.sender?.name,
            },
            receiver: {
              userId: msg.receiver?._id,
              name: msg.receiver?.name,
            },
            content: msg.message,
            sentAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          }
        ),
      ),
      totalMessages: conversation.message.length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));

    res.status(200).json({
      success: true,
      totalConversations: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

// Alternative: Get conversation by ID (single conversation with all messages)
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await conversationModel
      .findById(conversationId)
      .populate({
        path: "message",
        select: "senderId receiverId message createdAt updatedAt",
        populate: [
          {
            path: "senderId",
            select: "username email avatar",
          },
          {
            path: "receiverId",
            select: "username email avatar",
          },
        ],
      })
      .populate({
        path: "participants",
        select: "username email avatar _id",
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Format response
    const formattedConversation = {
      conversationId: conversation._id,
      participants: conversation.participants.map((user) => ({
        userId: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      })),
      participantNames: conversation.participants
        .map((user) => user.username)
        .join(" -- "),
      messages: conversation.message.map((msg) => ({
        messageId: msg._id,
        sender: {
          userId: msg.senderId?._id,
          username: msg.senderId?.username,
          avatar: msg.senderId?.avatar,
        },
        receiver: {
          userId: msg.receiverId?._id,
          username: msg.receiverId?.username,
          avatar: msg.receiverId?.avatar,
        },
        content: msg.message,
        sentAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      totalMessages: conversation.message.length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedConversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching conversation",
      error: error.message,
    });
  }
};

// Get conversations for specific user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await conversationModel
      .find({ participants: userId })
      .populate({
        path: "message",
        select: "senderId receiverId message createdAt updatedAt",
        populate: [
          {
            path: "senderId",
            select: "username email avatar",
          },
          {
            path: "receiverId",
            select: "username email avatar",
          },
        ],
      })
      .populate({
        path: "participants",
        select: "username email avatar _id",
      })
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map((conversation) => ({
      conversationId: conversation._id,
      participants: conversation.participants.map((user) => ({
        userId: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      })),
      participantNames: conversation.participants
        .map((user) => user.username)
        .join(" -- "),
      messages: conversation.message.map((msg) => ({
        messageId: msg._id,
        sender: {
          userId: msg.senderId?._id,
          username: msg.senderId?.username,
          avatar: msg.senderId?.avatar,
        },
        receiver: {
          userId: msg.receiverId?._id,
          username: msg.receiverId?.username,
          avatar: msg.receiverId?.avatar,
        },
        content: msg.message,
        sentAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
      totalMessages: conversation.message.length,
      lastMessage:
        conversation.message.length > 0
          ? conversation.message[conversation.message.length - 1]
          : null,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));

    res.status(200).json({
      success: true,
      totalConversations: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user conversations",
      error: error.message,
    });
  }
};
