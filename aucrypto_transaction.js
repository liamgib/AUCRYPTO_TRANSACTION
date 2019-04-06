const process = require('process');
const express = require('express');
const app = express();


app.get('/', (req, res) => {
    console.log(process.pid + " = Request inbound");
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('AUCRYPTO - Transaction worker started → PORT 3000');
});