import database_handler from './postgres/database_handler';
const database = new database_handler();

import express from "express";
import bodyParser from 'body-parser';
const hpp = require('hpp');
const helmet = require('helmet');
const contentLength = require('express-content-length-validator');
const cors = require("cors");  
const app = express();

//**  Security Middleware */
app.use(bodyParser.urlencoded({extended: false}));
app.use(hpp());
app.use(cors());
app.use(helmet());
app.use(helmet.hidePoweredBy({setTo: 'Coffee 1.0'}));
app.use(contentLength.validateMax({max: 9999, status: 400, message: "I see how it is. watch?v=ewRjZoRtu0Y"}));


app.get('/', (req, res) => {
  res.send('Hello World - Changed, again!!');
});

app.listen(3001, '0.0.0.0', async () => {
  await database.setupUserDB();
  await database.setupServersDB();
  
  console.log('AUCRYPTO - Transaction worker started → PORT 3001');
});