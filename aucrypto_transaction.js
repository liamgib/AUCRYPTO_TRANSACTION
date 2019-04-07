const process = require('process');
const express = require('express');
const database = require('./postgres/database');
const app = express();


app.get('/', (req, res) => {
    console.log(process.pid + " = Request inbound");
  res.send('Hello World!');
});

app.listen(3000, async () => {
  await database.doesTableExist('users').then(exists => {
    if(!exists) {
      database.createUserTable();
      
    }
  });
  let user_id = await database.createUser('liamagibsaa', 'testing123');
  console.log("A", user_id);
  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});