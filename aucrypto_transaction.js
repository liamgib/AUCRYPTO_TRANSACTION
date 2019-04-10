const process = require('process');
const express = require('express');
const database = require('./postgres/database_handler');
const app = express();


app.get('/', (req, res) => {
    console.log(process.pid + " = Request inbound");
  res.send('Hello World!');
});

app.listen(3000, async () => {
  await database.doesTableExist('users').then(exists => {
    if(!exists) {
      database.getUserDatabase().createUserTable();
    }
  });

  await database.doesTableExist('session').then(exists => {
    if(!exists) {
      database.getUserDatabase().createSessionTable();
    }
  });

  //let user_id = await database.getUserDatabase().createUser('liamagibasaa', 'testing123');

  /*
  let session;
  await database.getUserDatabase().loginUser('liamagibasaa', 'testing123').then(result => {
    let isLoggedIn = result[0]
    let session_or_verifykey = result[1];
    session = result[1];
    console.log("A", isLoggedIn, session_or_verifykey);
  });
  let is_session = await database.getUserDatabase().isSession(session);
  console.log(session, is_session);
  */
 
  //let verify_user = await database.getUserDatabase().userVerification('0c5596a79c0e55e953c2b3b7dd93affb0b6bb763', 6976);
  //console.log("Verified: ", verify_user);


  //let email_exists = await database.getUserDatabase().doesEmailExist('liamgibsaa');
  //console.log(email_exists);

  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});