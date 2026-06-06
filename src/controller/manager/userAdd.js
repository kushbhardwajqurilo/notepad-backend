const loginModel = require("../../model/loginUser")

exports.addUser = async(req,res)=>{
    try {
        const mangerId = req.user.id
        const data = req.body
        const objData = {
            // email:data.email,
            password:data.password,
            name:data.name,
            managerId:mangerId
        }

        const createData  = await loginModel.create(objData)
        if(createData){
            res.status(200).json({
                message:"User Create Success"
            })
        }else{
            res.status(400).json({
                message:"User Not Create"
            })
        }

    } catch (error) {
        res.status(501).json({
            message:"Internal Server Error"
        })
    }
}