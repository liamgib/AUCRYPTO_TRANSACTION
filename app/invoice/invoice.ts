import Coin from '../currency/coin';
import Company from '../modules/company';
import ExchangeCenter from '../currency/exchangecenter';
import database_handler from '../postgres/database_handler';
import NL_Server from '../currency/NL_Server';
import {Pool, PoolClient} from 'pg';
import { resolve } from 'url';
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://58c760d17c60405db13f92bbe1744a89@sentry.io/1497974' });

export default class Invoice {


    private amountAUD: number;
    private amountPaidAUD: number;
    private status: 'PENDING' | 'UNDERPAID' | 'OVERPAID' | 'PAID';
    private remainingAmounts: any;
    private totalAmountCoins: any;
    private lastConverted: Date;
    private lastPaidTime: Date;
    private acceptedCoins: Coin[];
    private depositAddresses: any = {};
    private acceptedMinimumDeposit: 'MEMPOOL' | 'UNCONFIRMED' | 'CONFIRMED';
    private invoiceID: string;
    private invoiceCompany: Company;
    private transactions: String[] = [];

    private ExCenter: ExchangeCenter;
    private database:database_handler;
    constructor(invoiceCompany: Company, amountAUD: number, ExchangeCenter: ExchangeCenter, acceptedCoins: Coin[]) {
        this.database = new database_handler(ExchangeCenter);
        this.invoiceID = this.generateUUID();
        this.invoiceCompany = invoiceCompany;
        this.amountAUD = amountAUD;
        this.ExCenter = ExchangeCenter;
        this.acceptedCoins = acceptedCoins;
        this.status = 'PENDING';
        this.acceptedMinimumDeposit = 'UNCONFIRMED';
    }


    /**
     * 
     * @param symbol Coin Symbol
     * @param amount Amount of coin
     * @param eventType Type of deposit either 'MEMPOOL_DEPOSIT' || 'UNCONFIRMED_DEPOSIT' || 'CONFIRMED_DEPOSIT'
     */
    public async addAmount(symbol:string, amount:number, eventType:string, poolClient:PoolClient):Promise<any> {
        let _this = this;
        return new Promise(async (resolve) => {
            let rate = this.remainingAmounts[symbol].rate;
            if(rate == undefined) return false;
            let amountAUD = amount * rate;
            let value = this.remainingAmounts[symbol].value;
            if(eventType == 'MEMPOOL_DEPOSIT' || eventType == 'UNCONFIRMED_DEPOSIT' || eventType == 'CONFIRMED_DEPOSIT'){
                let accepted = false;
                if(eventType == 'CONFIRMED_DEPOSIT' && (this.acceptedMinimumDeposit == 'MEMPOOL' ||  this.acceptedMinimumDeposit == 'UNCONFIRMED' ||  this.acceptedMinimumDeposit == 'CONFIRMED')) accepted = true;
                if(eventType == 'UNCONFIRMED_DEPOSIT'&& (this.acceptedMinimumDeposit == 'UNCONFIRMED' ||  this.acceptedMinimumDeposit == 'MEMPOOL')) accepted = true;
                if(eventType == 'MEMPOOL_DEPOSIT' && this.acceptedMinimumDeposit == 'MEMPOOL') accepted = true;
                if(accepted && this.status !== 'PAID' && this.status !== 'OVERPAID') {
                    this.lastPaidTime = new Date();
                    if(amount < value) {
                        //Underpaid //Split payment?
                        this.status = 'UNDERPAID';
                        this.amountPaidAUD += amountAUD;
                        this.remainingAmounts[symbol].value = value - amount;                    
                    } else if(amount == value) {
                        //Paid
                        this.status = 'PAID';
                        this.amountPaidAUD += amountAUD;
                        this.remainingAmounts[symbol].value = 0;
                    } else if(amount > value) {
                        //Overpaid
                        this.status = 'OVERPAID';
                        this.amountPaidAUD += amountAUD;
                        this.remainingAmounts[symbol].value = value - amount;  
                    }
                    //Update database
                    let updateResult = await this.database.getInvoicesDatabase().updateInvoice(this, poolClient);
                    if(updateResult == true) {
                        //Updated, resolve
                        console.log(`Processed Payment ${this.invoiceID} AM:${amount} - ${eventType} - ${this.status}`);
                        Sentry.addBreadcrumb({
                            category: 'invoiceUpdate',
                            message: `Processed payment`,
                            data: {amount: amount, eventType: eventType, symbol: symbol, invoiceID: this.getInvoiceID(), transactions: this.getTransactions()},
                            level: Sentry.Severity.error
                          });
                        if(poolClient !== undefined) poolClient.query('COMMIT');
                        if(poolClient !== undefined) poolClient.release();
                        resolve(true);
                    }else {
                        //Error occured, log.
                        Sentry.addBreadcrumb({
                            category: 'invoiceUpdate',
                            message: `Error processing Payment ${this.invoiceID} [OVERPAID-ALREADYPAID]`,
                            data: {amount: amount, eventType: eventType, symbol: symbol, invoiceID: this.getInvoiceID(), transactions: this.getTransactions()},
                            level: Sentry.Severity.error
                          });
                        if(poolClient !== undefined) poolClient.query('ROLLBACK');
                        resolve(`Error processing Payment ${this.invoiceID} [DBUPDATE]`);
                    }
                } else {
                    if(poolClient !== undefined) poolClient.query('ROLLBACK');
                    if(poolClient !== undefined) poolClient.release();
                    if(this.status == 'PAID' || this.status == 'UNDERPAID') {
                       //Status is already marked as paid...? Overpaid?
                       Sentry.addBreadcrumb({
                        category: 'invoiceUpdate',
                        message: `Error processing Payment [OVERPAID-ALREADYPAID]`,
                        data: {amount: amount, eventType: eventType, symbol: symbol, invoiceID: this.getInvoiceID(), transactions: this.getTransactions()},
                        level: Sentry.Severity.error
                      });
                       resolve(`Error processing Payment [OVERPAID-ALREADYPAID]`);
                    } else {
                       //Payment is not adequate enough to validate
                       resolve(true);
                    }
    
                }
            }
        });
    }

    public async setupInvoice() {
        await this.getExchangeRates();
        let generated = await this.generateDepositAddresses();
        return generated;
    }


    /**
     * Used to generate the most up to exchange rates for the invoice amount.
     */
    public async getExchangeRates() {
        this.remainingAmounts = await this.ExCenter.getRatesFromAUD(this.amountAUD);
        this.totalAmountCoins = this.remainingAmounts;
        this.lastConverted = new Date();
        return this.remainingAmounts;
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
                let address = await NLServer.getNewAddress(this.invoiceID);
                if(address['address'] == '' || address == '') {
                    //Failed to generate address.
                    console.log('Failed to generate address...', this.acceptedCoins[i].getSymbol(), this.getInvoiceID());
                    if(i == len - 1) return resolve(false);
                }else {
                    this.depositAddresses[this.acceptedCoins[i].getSymbol()] = address['address'];
                    if(i == len - 1) return resolve(true);
                }
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
     * Used to update the invoice ID instance. 
     * @param uuid New UUID to update with
     */
    public setInvoiceID(uuid:string) {
        this.invoiceID = uuid;
    }

    public setStatus(status:'PENDING' | 'UNDERPAID' | 'OVERPAID' | 'PAID') {
        this.status = status;
    }

    public setDepositAddresses(depositAddresses:any) {
        this.depositAddresses = depositAddresses;
    }

    public setRemainingAmounts(RemainingAmounts:any) {
        this.remainingAmounts = RemainingAmounts;
    }

    public setTotalAmountCoins(totalAmountCoins:any){
        this.totalAmountCoins = totalAmountCoins;
    }

    public setAcceptedMinimumDeposit(acceptedMinimumDeposit: 'MEMPOOL' | 'UNCONFIRMED' | 'CONFIRMED') {
        this.acceptedMinimumDeposit = acceptedMinimumDeposit;
    }

    public setTransactions(transactions:String[]) {
        this.transactions = transactions;
    }

    public setAmountPaidAUD(amount:number){
        this.amountPaidAUD = amount;
    }

    public setLastPaidTime(date:Date){
        this.lastPaidTime = date;
    }
    
    /**
     * Will return the DB ID of the company instance.
     * 12F47AS2
     * @returns {String} Invoice ID
     */
    public getInvoiceID():string {
        return this.invoiceID;
    }

    public getStatus():string {
        return this.status;
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
        return this.remainingAmounts;
    }

    public getTotalAmountCoins() {
        return this.totalAmountCoins;
    }

    public getAcceptedMinimumDeposit() {
        return this.acceptedMinimumDeposit
    }

    public getTransactions() {
        return this.transactions;
    }

    public getLastPaidTime(){
        return this.lastPaidTime;
    }


    
}