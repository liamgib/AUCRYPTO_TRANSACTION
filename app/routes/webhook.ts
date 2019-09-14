import express from "express";
import crypto from "crypto";
import ExchangeCenter from '../currency/exchangecenter';
const ExCenter = new ExchangeCenter();

import database_handler from '../postgres/database_handler';
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
    if(!server) return next({error: 'Unable to identify server.'});
    let servInstance = await database.getServerDatabase().getServer(server);
    if(servInstance == '') return next({error: 'Unable to identify server.'});
    const payload = JSON.stringify(req.body);
    if(!payload){
        return next('Request body empty');
    }

    const hmac = crypto.createHmac('sha1', servInstance[0]);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');
    const checksum = req.get('XINTERAUCRYPTOVERIF');
    if(!checksum || !digest || checksum !== digest) {
        return next({error: 'Request body digest did not match verification.'});
    }
    return next();
}


router.post('/getRedirectionAddress', authenticationMiddleware, async(req, res) => {
    const server = req.get('XINTERAUCRYPTOSERV');
    //Get coin from symbol
    let coin = await database.getCurrenciesDatabase().getCoinFromServerID(server);
    if(coin == null) {
        console.log('Unable to determine SYMBOL [getRedirectionAddress]', req.body);
        Sentry.addBreadcrumb({
            category: 'getRedirectionAddress',
            data: req.body,
            level: Sentry.Severity.fatal
          });
        Sentry.captureException(new Error(`Unable to determine SYMBOL`));
        res.status(400).send({status: 'Unable to determine SYMBOL.'});
    } else {
        let invoiceID = req.body.invoiceID;
        let invoice = await database.getInvoicesDatabase().getInvoiceFromID(invoiceID);
        let redirection = await invoice.getCompany().getCoinRedirectAddress(coin.getSymbol());
        res.status(200).send({symbol: coin.getSymbol(), address: redirection});
    }
});

router.post('/invoiceUpdate', authenticationMiddleware, async (req, res) => {
    const server = req.get('XINTERAUCRYPTOSERV');
    //Get coin from symbol
    let coin = await database.getCurrenciesDatabase().getCoinFromServerID(server);
    if(coin == null) {
        console.log('Unable to determine SYMBOL', req.body);
        Sentry.addBreadcrumb({
            category: 'invoiceUpdate',
            data: req.body,
            level: Sentry.Severity.fatal
          });
        Sentry.captureException(new Error(`Unable to determine SYMBOL`));
        res.status(400).send({status: 'Unable to determine SYMBOL.'});
    }else {
        if(req.body.hasOwnProperty('data')) {
            if(req.body.data.hasOwnProperty('events')) {
                if(req.body.data.events.hasOwnProperty('invoiceID')) {
                    let invoiceD = await database.getInvoicesDatabase().getInvoiceFromIDWithLOCK(req.body.data.events.invoiceID);
                    if(invoiceD !== undefined) {
                        let invoice = invoiceD[0];
                        let eventType = req.body.eventType;
                        if(eventType == 'MEMPOOL_DEPOSIT' || eventType == 'UNCONFIRMED_DEPOSIT' || eventType == 'CONFIRMED_DEPOSIT') {
                            //Check if transaction is already added
                            if(invoice.getTransactions().indexOf(req.body.data.transactionID) == -1) {
                                let tx = invoice.getTransactions();
                                tx.push(req.body.data.transactionID);
                                invoice.setTransactions(tx);
                                if(eventType == 'CONFIRMED_DEPOSIT') {
                                    let paymentTransactionsIDS = invoice.getPaymentTransactionIDs();
                                    if(paymentTransactionsIDS.indexOf(req.body.data.paymentTransactionID) == -1) paymentTransactionsIDS.push(req.body.data.paymentTransactionID);
                                    invoice.setPaymentTransactionIds(paymentTransactionsIDS);
                                }
                                let amountResult = await invoice.addAmount(coin.getSymbol(), req.body.data.amount, eventType, invoiceD[1]);
                                Sentry.addBreadcrumb({
                                    category: 'invoiceUpdate',
                                    message: amountResult,
                                    data: req.body,
                                    level: Sentry.Severity.fatal
                                  });
                                if(amountResult !== true) Sentry.captureException(new Error(amountResult));
                            } else {
                                if(eventType == 'CONFIRMED_DEPOSIT') {
                                    let paymentTransactionsIDS = invoice.getPaymentTransactionIDs();
                                    if(paymentTransactionsIDS.indexOf(req.body.data.paymentTransactionID) == -1) paymentTransactionsIDS.push(req.body.data.paymentTransactionID);
                                    invoice.setPaymentTransactionIds(paymentTransactionsIDS);
                                    let amountResult = await invoice.addAmount(coin.getSymbol(), 0, eventType, invoiceD[1]);
                                } else {
                                    //Aready inserted, confirmation? 
                                    //If so, forward
                                    invoiceD[1].query('ROLLBACK');
                                    invoiceD[1].release();
                                }
                            }
                           
                        }else {
                            //Amount was subtracted from an invoice account? 
                            //Log and crosx if expected.
                            invoiceD[1].query('ROLLBACK');
                            invoiceD[1].release();
                            Sentry.addBreadcrumb({
                                category: 'invoiceUpdate',
                                message: 'Substracted from an unexpected invoice account',
                                data: req.body,
                                level: Sentry.Severity.fatal
                              });
                            Sentry.captureException(new Error('Substracted from an unexpected invoice account'));
                        }
                    } else {
                        //Unable to find invoice
                        Sentry.addBreadcrumb({
                            category: 'invoiceUpdate',
                            message: 'Unable to find invoice with ID',
                            data: req.body,
                            level: Sentry.Severity.fatal
                          });
                        Sentry.captureException(new Error('Unable to find invoice with ID'));
                    }
                } else {
                    //No invoice associated with data, error log.
                    Sentry.addBreadcrumb({
                        category: 'invoiceUpdate',
                        message: 'No invoice associated with data',
                        data: req.body,
                        level: Sentry.Severity.error
                      });
                    Sentry.captureException(new Error('No invoice associated with data'));
                }
            } else {
                //No events associated with data of update, error log.
                Sentry.addBreadcrumb({
                    category: 'invoiceUpdate',
                    message: 'No events associated with data of update',
                    data: req.body,
                    level: Sentry.Severity.error
                  });
                Sentry.captureException(new Error('No events associated with data of update'));
            }
        } else {
            //Unable to determine request, error log
            Sentry.addBreadcrumb({
                category: 'invoiceUpdate',
                message: 'Unable to determine request',
                data: req.body,
                level: Sentry.Severity.info
              });
            Sentry.captureException(new Error('Unable to determine request'));
        }
        res.status(200).send({status: 'Received update'});
    }
})

router.use((err:any, req:any, res:any, next:any) => {
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    Sentry.captureException(new Error('Authentication Failure - ' + ip));
    res.status(403).send('Request body was not signed or verification failed');
});


module.exports = router;