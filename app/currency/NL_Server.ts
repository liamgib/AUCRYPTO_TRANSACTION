import database_handler from '../postgres/database_handler';
import crypto from "crypto";
const fetch = require('node-fetch');
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://58c760d17c60405db13f92bbe1744a89@sentry.io/1497974' });

export default class NL_Server {

    private serverIdent: string;
    private databaseHandler: database_handler;

    constructor(serverIdent: string, databaseHandler: database_handler) {
        this.serverIdent = serverIdent;
        this.databaseHandler = databaseHandler;
    }


    /**
     * Used to communicate with the WEB server of the NodeListener instance.
     */
    public getNewAddress(invoiceId:string):Promise<any> {
        return new Promise<any>( async (resolve) => {
            try {
                let data = await this.databaseHandler.getServerDatabase().getServer(this.serverIdent);
                let session = data[0];
                if(session == '') console.log('Unable to find session');
                if(session == '') return resolve('');
                let host = data[1];
                if(host == '') console.log('Unable to find host');
                if(host== '') return resolve('');

                let payload = {invoiceId: invoiceId};
                const hmac = crypto.createHmac('sha1', session);
                const digest = 'sha1=' + hmac.update(JSON.stringify(payload)).digest('hex');
                fetch(`${host}/address`, {
                    method: 'post',
                    body: JSON.stringify({invoiceId: invoiceId}),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-INTER-AUCRYPTO-VERIF': digest }
                }).then((res:any) => res.json())
                .then((json:any) => {
                    return resolve(json);
                }).catch((err:any) => {
                    console.log(`Failed to connect to NL_SERVER ${this.serverIdent}`);
                    return resolve('');
                });
            } catch (e) {
                return resolve('');
            }
            
        });
    }
}