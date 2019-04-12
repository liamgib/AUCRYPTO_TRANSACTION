const database = require('./postgres/database_handler');

const express = require('express');
const bodyParser = require('body-parser');
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
  res.send('Hello World!');
});

app.listen(3000, async () => {
  await database.setupUserDB();
  await database.setupServersDB();

  /*
  await database.getUserDatabase().createUser('liamagibasaa', 'testing123').then(user_id => {
    console.log("A", user_id);
  });
  
  let verify_user = await database.getUserDatabase().userVerification('bd56b5cefb45d55b75c26fd0f90b5ec50d80cdaf', 8815);
  console.log("Verified: ", verify_user);

  let session;
  await database.getUserDatabase().loginUser('liamagibasaa', 'testing123').then(result => {
    let isLoggedIn = result[0]
    let session_or_verifykey = result[1];
    session = result[1];

    console.log("A", isLoggedIn, session_or_verifykey);
  });
  let is_session = await database.getUserDatabase().isSession(session);
  console.log(session, is_session);*/

  /*await database.getServerDatabase().createServer().then(result => {
    if(result !== false){
    let serv_id = result[0];
    let serv_key = result[1];
    console.log(serv_id, serv_key);
    }
  });
  */

  /*await database.getServerDatabase().loginServer('WEB-AU8785', '+dQEcAbeSdH5NRFyOEymOLZHi8o3UeDCkhn3CGnL').then(result => {
    console.log(result);
  })*/




  //let email_exists = await database.getUserDatabase().doesEmailExist('liamgibsaa');
  //console.log(email_exists);

  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});