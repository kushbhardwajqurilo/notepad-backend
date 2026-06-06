const MessageModel = require("../../model/chatModal")
const loginModel = require("../../model/loginUser")

exports.getAllMessagesManager = async (req,res)=>{
    try {
        const receiver = req.params.receiver
        let messages = await MessageModel.find({
            $or:[
                {receiver},
                {sender:receiver}
            ]
        }).sort('timestamp')
        messages = messages.map((message)=>{
            return {
                sender: message.sender,
                receiver: message.receiver,
                message: message.message,
                attachment:message.attachment ?message.attachment = `https://notepad-backend-f10dee9eba58.herokuapp.com/public/files/${message.attachment}` : null,
            }
        })

        res.json({
            status:"success",
            data:messages
        })

    } catch (error) {
        res.status(500).json({error:"Failed to fetch messages"})
    }
}


exports.getAllUserChatNameManager = async (req, res) => {
    try {
      const data = await loginModel.find({}, { name: 1, _id: 1 }).sort({createdAt:-1})
      if (data.length > 0) {
        res.json({
          status: "success",
          data: data,
        });
      } else {
        res.json({
          status: "failed",
          message: "Not User Found",
        });
      }
    } catch (error) {
      res.json({
        status: "failed",
        message: "Not User Found",
        error: error,
      })
    }
  };