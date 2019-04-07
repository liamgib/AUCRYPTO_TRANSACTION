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
  let user_id = await database.getUserDatabase().createUser('liamagibasaa', 'testing123');
  console.log("A", user_id);
  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});