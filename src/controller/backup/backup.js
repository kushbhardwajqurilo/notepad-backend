const { default: axios } = require("axios")
// const NotesBackup = require("../../model/notesbackup")
// const loginBackup = require("../../model/loginUserbackup");
const NotesBackup = require("../../model/notesbackup");
const loginBackup = require("../../model/loginUserbackup");
const loginModel = require("../../model/loginUser");
const NotesModel = require("../../model/notes");

exports.userBackup = async (req,res)=>{
    try {
        // const data = await axios.get("https://notepad-backend-f10dee9eba58.herokuapp.com/api/allnotesbackup") 
        const notes = await NotesModel.find({});


        let existNote = await NotesBackup.find({})
        console.log(existNote)
        const unique = []
         existNote.map((item)=>{
             unique.push({
                orgId:item.orgId.toString(),
                // updateStatus:item.updateStatus,
                updatedAt:item.updatedAt
             })
        })

        let originalDatabase = []

        notes.map((item)=>{
            originalDatabase.push({
                orgId:item._id,
                content:item.content,
                userId:item.userId,
                createdAt:item.createdAt,
                updatedAt:item.updatedAt,
                updateStatus:item.updateStatus
            })
        })

         

        // let newArray  = []

        let newArray = []
        originalDatabase.map(async(item,index)=>{
            const existingNote=existNote.find((data)=>data.orgId.toString() === item.orgId.toString())
                if(!existingNote){
                  newArray.push(item);
                  return;
                }
                if(existingNote.updatedAt < item.updatedAt){
                   console.log("updated")
                   existingNote.content=item.content;
                   await existingNote.save();
               }

            
        })

        
        const sendData = await NotesBackup.create(newArray)
        if(sendData.length>0){
            res.json({
                status:"success",
                message:"Backup Success",
                data:sendData
            })
        }else{
            res.json({
                status:"failed",
                message:"Already Backup"
            })
        }

    } catch (error) {
        
    }
}


exports.userLoginBackup = async (req,res)=>{    
    try {
        // const data = await axios.get("https://notepad-backend-f10dee9eba58.herokuapp.com/api/logindetails")
        const data = await loginModel.find({})


        let existNote = await loginBackup.find({})
        
        const unique = []
         existNote.map((item)=>{
             unique.push(item.orgId.toString())
        })

        console.log(unique)
        
        let originalDatabase = []

        data.map((item)=>{
            originalDatabase.push({
                orgId:item._id,
                password:item.password,
                name:item.name,
                createdAt:item.createdAt,
                updatedAt:item.updatedAt
            })
        })

        let newArray  = []

        originalDatabase.map((item)=>{
            if(!unique.includes(item.orgId.toString())){
                 newArray.push(item)
            }
        })


        const sendData = await loginBackup.create(newArray)
        if(sendData.length>0){
            res.json({
                status:"success",
                message:"Backup Success",
                data:sendData
            })}
        else{
            res.json({
                status:"failed",
                message:"Already Backup"
            })
        }
    } catch (error) {
        
    }
}