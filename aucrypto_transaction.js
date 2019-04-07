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

  //let user_id = await database.getUserDatabase().createUser('liamagibasaa', 'testing123');
  
  /*
  database.getUserDatabase().loginUser('liamagibasaa', 'testing123').then(result => {
    let isLoggedIn = result[0]
    let session_or_verifykey = result[1];
    console.log("A", isLoggedIn, session_or_verifykey);
  });
  */

  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});