const express = require('express')
const { userBackup, userLoginBackup } = require('../controller/backup/backup')

const BackupRoute = express.Router()

BackupRoute.get('/notesbackup',userBackup)
BackupRoute.get('/loginbackup',userLoginBackup)
 

module.exports = BackupRoute