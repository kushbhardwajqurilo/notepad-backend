const io = require("../../..");
const MessageModel = require("../../model/chatModal");
const loginModel = require("../../model/loginUser");
 
exports.addMessage = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiver, message} = req.body;
    const objData = {
        sender: sender,
      receiver: receiver,
      message: message,
      read: false,
      attachment:  req.file ? req.file.filename : null
      
    };
    
    const user =await loginModel.findOneAndUpdate({ _id: sender }, { $inc:{[ `newMessages.${receiver}`]: 1 } });
    console.log(user);
    // fileUpload: req.file ? req.file.path.replace(/\\/g, '/') : null 
    const dataCreate = await MessageModel.create(objData);
    
    if (dataCreate) {
      res.json({
        status: "success",
        message: "Message Send",
      });
    }else{
        res.json({
            status: "failed",
            message: "Message Not Send",
          });
    }
  } catch (error) {
    res.json({
      status: "failed",
      message: "Message Not Send",
      error: error,
    })
  }
};

exports.getAllMessage = async (req, res) => {

  const receiver = req.user.id;

  const { sender } = req.body;
  try {
    let messages = await MessageModel.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort('timestamp');

// const countMessageRead = messages.filter((message) => {
//   return message.read === false && message.receiver === receiver;
// })

    messages = messages.map((message) =>
      {
        return {
          sender: message.sender,
          receiver: message.receiver,
          message: message.message,
          // read: countMessageRead.length,
          attachment:message.attachment ?message.attachment = `http://192.168.1.5:4444/public/files/${message.attachment}` : null,
        };
      }
    );

    res.json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

exports.getAllUserChatName = async (req, res) => {
  try {
    const user=await loginModel.findById(req.user.id);
    const userContacts = await loginModel.find({}, { name: 1, _id: 1 }).sort({createdAt:-1})
     const data=userContacts.map(contact=>(
      {
         _id:contact._id,
         name:contact.name,
         newMessages:user.newMessages.get(contact._id.toString())||0,
     }))
    if (data.length > 0) {
      res.json({
        status: "success",
        data:data,
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






 