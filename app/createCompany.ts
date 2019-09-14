
import ExchangeCenter from './currency/exchangecenter';
const ExCenter = new ExchangeCenter();

import database_handler from './postgres/database_handler';
import Company from './modules/company';
const database = new database_handler(ExCenter);

async function start() {
    let comp = new Company('Digital Servers', {'NAH': 'Sgqve2gw8S1GgdBryWFjFzEzTnR4fyntfR'});
    let res = await database.getCompanyDatabase().insertCompany(comp);
    console.log(res);
}
start();