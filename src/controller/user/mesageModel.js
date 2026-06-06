// const io = require("../../..");
// const { getReceiverSocketId } = require("../../..");
// const MessageModel = require("../../model/chatModal");
// const conversationModel = require("../../model/conversatation")
// const messageModel = require("../../model/messagcollection");


// // conversationModel
// // Message


// exports.sendMessage = async (req, res) => {
//     try {
//         const { message, senderId } = req.body;
//         const { id: receiverId } = req.params;

//         let conversation = await conversationModel.findOne({
//             participants: { $all: [senderId, receiverId] },
//         });

//         if (!conversation) {
//             conversation = await conversationModel.create({
//                 participants: [senderId, receiverId],
//                 messages: [], // Initialize messages array
//             });
//         }

//         const newMessage = new messageModel({
//             senderId,
//             receiverId,
//             message,
//         });

//         // Ensure messages array is initialized
//         if (!conversation.messages) {
//             conversation.messages = [];
//         }

//         if (newMessage) {
//             conversation.message.push(newMessage._id);
//         }

//         await Promise.all([conversation.save(), newMessage.save()]);

//         // SOCKET IO FUNCTIONALITY WILL GO HERE
//         const receiverSocketId = getReceiverSocketId(receiverId);
//         if (receiverSocketId) {
//             io.to(receiverSocketId).emit("newMessage", newMessage);
//         }

//         res.status(201).json(newMessage);
//     } catch (error) {
//         console.log("Error in sendMessage controller: ", error.message);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };


// exports.getMessages = async (req, res) => {
// 	try {
// 		const { id: userToChatId } = req.params;
// 		const senderId = req.user.id;
//         console.log(senderId, userToChatId)

// 		const conversation = await conversationModel.findOne({
// 			participants: { $all: [senderId, userToChatId] },
// 		}).populate('message'); 
// 		if (!conversation) return res.status(200).json([]);

// 		const messages = conversation.message;

// 		res.status(200).json(messages);
// 	} catch (error) {
// 		console.log("Error in getMessages controller: ", error.message);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// };