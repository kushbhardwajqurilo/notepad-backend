const express = require('express')
const cors = require('cors')
const UserRoute = require('./src/route/user')
const AdminRoute = require('./src/route/admin')
const BackupRoute = require('./src/route/backup')
 
const app = express()

// const corsOptions = {
//     origin: true, // Allow all origins
//     credentials: true // Allow cookies and other credentials
// };

const corsOptions = {
    origin: '*',  // This allows all origins
    credentials: true
};

app.use(cors(corsOptions));

app.use('/public', express.static('public'));
require("dotenv").config();

app.use(express.json())

// mainDb()

app.use('/api',UserRoute)
app.use('/admin',AdminRoute)
app.use('/backup',BackupRoute)
// app.use('/socket',messageRoute)

module.exports = app
