const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://58c760d17c60405db13f92bbe1744a89@sentry.io/1497974' });
import ExchangeCenter from './currency/exchangecenter';
const ExCenter = new ExchangeCenter();
ExCenter.calculateRates();
ExCenter.startPriceHeartBeat();

import database_handler from './postgres/database_handler';
const database = new database_handler(ExCenter);
import Invoice from './invoice/invoice';

import express from "express";
import bodyParser from 'body-parser';
import Company from './modules/company';
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
app.use('/webhook', require('./routes/webhook'));
app.use('/api/v1', require('./routes/api'));

app.get('/', (req, res) => {
  res.send('Hello World - Changed, again!!');
});

app.listen(8001, '127.0.0.1', async () => {
  await database.setupUserDB();
  await database.setupServersDB();
  let coins = await database.getCurrenciesDatabase().getCoins();
  //let inv = new Invoice('1245343434', null, 190, ExCenter, coins);
  //await inv.setupInvoice();
  //console.log(inv);
  /*let comp = new Company('Acme Organsiation', {'NAH': 'abcdf', 'BTC': 'DTC'});
  comp.setUUID('b014f36c-4967-46a4-bbd8-b39f898413ff');
  let invoice = new Invoice(comp, 0.5, ExCenter, coins);


  await invoice.setupInvoice();

  database.getInvoicesDatabase().insertInvoice(invoice);
  */

  //console.log(inv.getAcceptedCoinsString());
  //database.getCompanyDatabase().insertCompany(comp);
  console.log('AUCRYPTO - Transaction worker started → PORT 3001');
});