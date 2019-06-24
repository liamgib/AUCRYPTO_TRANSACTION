import express from "express";
import database_handler from '../postgres/database_handler';
import crypto from "crypto";
const database = new database_handler();
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
    const server = req.get('X-INTER-AUCRYPTO-SERV');
    if(!server) return next({error: 'Unable to identify server.'});
    let servInstance = await database.getServerDatabase().getServer(server);
    if(servInstance == '') return next({error: 'Unable to identify server.'});
    
    const payload = JSON.stringify(req.body);
    if(!payload){
        return next('Request body empty');
    }

    const hmac = crypto.createHmac('sha1', servInstance[0]);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');
    const checksum = req.get('X-INTER-AUCRYPTO-VERIF');
    if(!checksum || !digest || checksum !== digest) {
        return next({error: 'Request body digest did not match verification.'});
    }
    return next();
}


router.post('/invoiceUpdate', authenticationMiddleware, (req, res) => {
    console.log(req.body);
    res.status(200).send({status: 'Received update'});
})

router.use((err:any, req:any, res:any, next:any) => {
    res.status(403).send({error: 'Request body was not signed or verification failed'});
});


module.exports = router;