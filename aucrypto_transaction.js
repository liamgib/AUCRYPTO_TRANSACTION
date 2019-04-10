const process = require('process');
const express = require('express');
const database = require('./postgres/database_handler');
const app = express();


app.get('/', (req, res) => {
    console.log(process.pid + " = Request inbound");
  res.send('Hello World!');
});

app.listen(3000, async () => {
  await database.setupUserDB();

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
  



  //let email_exists = await database.getUserDatabase().doesEmailExist('liamgibsaa');
  //console.log(email_exists);

  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});