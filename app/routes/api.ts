import express from "express";
import crypto from "crypto";
import ExchangeCenter from '../currency/exchangecenter';
const ExCenter = new ExchangeCenter();

import database_handler from '../postgres/database_handler';
import Company from "../modules/company";
import Invoice from '../invoice/invoice';

const database = new database_handler(ExCenter);
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://58c760d17c60405db13f92bbe1744a89@sentry.io/1497974' });

let router = express.Router();


router.post('/login', (req, res) => {
    if(!req.body.serverId || !req.body.serverKey) return res.status(403).send('Request body was invalid.');
    let serverId = req.body.serverId;
    let serverKey = req.body.serverKey;
    database.getServerDatabase().loginServer(serverId, serverKey).then((result:any) => {
          let ifLoggedIn = result[0];
          let session = result[1];
          return res.status(500).send({loggedIn: ifLoggedIn, session: session})
    });
});

async function authenticationMiddleware(req:any, res:any, next:any) {
    const server = req.get('XINTERAUCRYPTOSERV');
    if(!server) console.log(JSON.stringify(req.headers));
    if(!server) console.log('Unable to identify server.');
    if(!server) return next({error: 'Unable to identify server.'});
    
    let servInstance = await database.getServerDatabase().getServer(server);
    if(servInstance == '') console.log('Unable to identify server.');
    if(servInstance == '') return next({error: 'Unable to identify server.'});
    
    const payload = JSON.stringify(req.body);
    if(!payload){
        return next('Request body empty');
    }

    if(req.method != 'GET') {
        const hmac = crypto.createHmac('sha1', servInstance[0]);
        const digest = 'sha1=' + hmac.update(payload).digest('hex');
        const checksum = req.get('XINTERAUCRYPTOVERIF');
        if(!checksum || !digest || checksum !== digest) {
            console.log('Checksum did not match');
            return next({error: 'Request body digest did not match verification.'});
        }
    }
    return next();
}


router.post('/invoice', authenticationMiddleware, async (req, res) => {
    if(!req.body.amount) return res.status(403).json({error: 'Missing invoice amount'});
    if(!req.body.acceptedMinimumDeposit) return res.status(403).json({error: 'Missing invoice acceptedMinimumDeposit'});
    let acceptedMinimumDeposit = req.body.acceptedMinimumDeposit;
    if(acceptedMinimumDeposit !== 'MEMPOOL' && acceptedMinimumDeposit !== 'UNCONFIRMED' && acceptedMinimumDeposit !== 'CONFIRMED') return res.status(403).json({error: 'Invalid acceptedMinimumDeposit'});
   
    let coins = await database.getCurrenciesDatabase().getCoins();
    let comp = await database.getCompanyDatabase().getCompanyWithAPIClient(req.get('XINTERAPICLIENT'));
    if(!comp) {
        return res.status(400).json({status: 'Error', code: 'AT-IC1', message: 'Error with API Client, refer to support.'});
    } else {
        let invoice = new Invoice(comp, req.body.amount, ExCenter, coins);
        invoice.setAcceptedMinimumDeposit(acceptedMinimumDeposit);
    
        let invRes = await invoice.setupInvoice();
        if(invRes) {
            database.getInvoicesDatabase().insertInvoice(invoice);
        return res.status(200).json({invoiceid: invoice.getInvoiceID(), amountAUD: invoice.getAmountAUD(), amounts: invoice.getTotalAmountCoins(), depositaddresses: invoice.getDepositAddresses()});
        } else {
            return res.status(400).json({status: 'Error', code: 'NL-AG1', message: 'Error generating invoice, refer to support.'});
        }
    }
});

router.get('/invoice', authenticationMiddleware, async (req, res) => {
    let comp = await database.getCompanyDatabase().getCompanyWithAPIClient(req.get('XINTERAPICLIENT'));
    let invoices = await database.getInvoicesDatabase().getCompanyInvoices(comp);
    res.status(200).json(invoices);
});

router.get('/invoice/:invoiceID', authenticationMiddleware, async (req, res) => {
    let invoiceID = req.params.invoiceID;
    let comp = await database.getCompanyDatabase().getCompanyWithAPIClient(req.get('XINTERAPICLIENT'));
    let invoices = await database.getInvoicesDatabase().getCompanyInvoice(comp, invoiceID);
    res.status(200).json(invoices);
});

router.use((err:any, req:any, res:any, next:any) => {
    console.log(err);
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    Sentry.captureException(new Error('Authentication Failure - ' + ip));
    return res.status(403).json({loggedIn: false, error: 'Missing authentication headers or verification failed'});
});


module.exports = router;