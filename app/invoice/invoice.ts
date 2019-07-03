import Coin from '../currency/coin';
import Company from '../modules/company';
import ExchangeCenter from '../currency/exchangecenter';
import database_handler from '../postgres/database_handler';
import NL_Server from '../currency/NL_Server';
import { runInNewContext } from 'vm';
import { resolve } from 'path';

export default class Invoice {


    private amountAUD: number;
    private amountPaidAUD: number; 
    private convertedRates: any;
    private totalAmountCoins: any;
    private lastConverted: Date;
    private acceptedCoins: Coin[];
    private depositAddresses: any = {};

    private invoiceID: string;
    private invoiceCompany: Company;

    private ExCenter: ExchangeCenter;
    private database:database_handler;
    constructor(invoiceCompany: Company, amountAUD: number, ExchangeCenter: ExchangeCenter, acceptedCoins: Coin[]) {
        this.database = new database_handler(ExchangeCenter);
        this.invoiceID = this.generateUUID();
        this.invoiceCompany = invoiceCompany;
        this.amountAUD = amountAUD;
        this.ExCenter = ExchangeCenter;
        this.acceptedCoins = acceptedCoins;
    }


    public async setupInvoice() {
        await this.getExchangeRates();
        await this.generateDepositAddresses();
        return true;
    }


    /**
     * Used to generate the most up to exchange rates for the invoice amount.
     */
    public async getExchangeRates() {
        this.convertedRates = await this.ExCenter.getRatesFromAUD(this.amountAUD);
        this.totalAmountCoins = this.convertedRates;
        this.lastConverted = new Date();
        return this.convertedRates;
    }


    /**
     * Used to generate invoice address IDs.
     */
    public async generateDepositAddresses() {
        return new Promise(async (resolve) => {
            for(let i = 0, len = this.acceptedCoins.length; i < len; i++) {
                let server = this.acceptedCoins[i].getServer();
                //Fetch server session
                let NLServer = new NL_Server(server, this.database);
                console.log(this.invoiceID);
                let address = await NLServer.getNewAddress(this.invoiceID);
                console.log(address);
                this.depositAddresses[this.acceptedCoins[i].getSymbol()] = address['address'];
                if(i == len - 1) return resolve();
            }
        })
    }

    private generateUUID() { // Public Domain/MIT
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxxxxxx4xxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /**
     * Will return the DB ID of the company instance.
     * 12F47AS2
     * @returns {String} Invoice ID
     */
    public getInvoiceID():string {
        return this.invoiceID;
    }

    /**
     * Used to update the invoice ID instance. 
     * @param uuid New UUID to update with
     */
    public setInvoiceID(uuid:string) {
        this.invoiceID = uuid;
    }

    public setDepositAddresses(depositAddresses:any) {
        this.depositAddresses = depositAddresses;
    }

    public setConvertedRates(convertedRates:any) {
        this.convertedRates = convertedRates;
    }

    public setTotalAmountCoins(totalAmountCoins:any){
        this.totalAmountCoins;
    }

    public getCompany():Company {
        return this.invoiceCompany;
    }

    public getAmountAUD():Number {
        return this.amountAUD;
    }

    public getAmountPaidAUD():Number {
        return this.amountPaidAUD;
    }

    public getConvertedTime():Date {
        return this.lastConverted;
    }

    public getAcceptedCoins():Coin[] {
        return this.acceptedCoins;
    }

    public getAcceptedCoinsString(): String[] {
        return this.acceptedCoins.map(coin => {
            return coin.getSymbol();
        });
    }

    public getDepositAddresses() {
        return this.depositAddresses;
    }

    public getRemainingAmountCoins() {
        return this.convertedRates;
    }

    public getTotalAmountCoins() {
        return this.totalAmountCoins;
    }



    
}