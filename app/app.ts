import database_handler from './postgres/database_handler';
const database = new database_handler();

import ExchangeCenter from './currency/exchangecenter';
const ExCenter = new ExchangeCenter();

import Invoice from './invoice/invoice';

import express from "express";
import bodyParser from 'body-parser';
const hpp = require('hpp');
const helmet = require('helmet');
const contentLength = require('express-content-length-validator');
const cors = require("cors");  
const app = express();

//**  Security Middleware */
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(hpp());
app.use(cors());
app.use(helmet());
app.use(helmet.hidePoweredBy({setTo: 'Vodka'}));
app.use(contentLength.validateMax({max: 9999, status: 400, message: "I see how it is. watch?v=ewRjZoRtu0Y"}));
app.use('/server', require('./routes/server'));

app.get('/', (req, res) => {
  res.send('Hello World - Changed, again!!');
});

app.listen(3001, '0.0.0.0', async () => {
  await database.setupUserDB();
  await database.setupServersDB();
  let coins = await database.getCurrenciesDatabase().getCoins();
  let inv = new Invoice('1245343434', null, 190, ExCenter, coins);
  await inv.setupInvoice();
  console.log(inv);
  console.log('AUCRYPTO - Transaction worker started → PORT 3001');
});