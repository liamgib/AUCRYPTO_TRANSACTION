
import ExchangeCenter from './currency/exchangecenter';
const ExCenter = new ExchangeCenter();

import database_handler from './postgres/database_handler';
const database = new database_handler(ExCenter);

async function start() {
    let res = await database.getServerDatabase().createServer()
    console.log(res);
}
start();