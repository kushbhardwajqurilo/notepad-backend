const bcrypt = require('bcrypt')

exports.getPasswordHash = (password)=>{
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password,salt)
}

exports.isVerify = (localpass,dbPass)=>{
    return bcrypt.compareSync(localpass,dbPass)
}