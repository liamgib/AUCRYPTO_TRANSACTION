import Coin from '../currency/coin';
import Company from '../modules/company';
import ExchangeCenter from '../currency/exchangecenter';
import database_handler from '../postgres/database_handler';
const database = new database_handler();
import NL_Server from '../currency/NL_Server';
import { runInNewContext } from 'vm';

export default class Invoice {


    private amountAUD: number;
    private amountPaidAUD: number; 
    private convertedRates: any;
    private lastConverted: Date;
    private acceptedCoins: Coin[];
    private remainingAmountCoins: any;
    private depositAddresses: any = {};

    private invoiceID: string;
    private invoiceCompany: Company;

    private ExCenter: ExchangeCenter;

    constructor(invoiceID:string, invoiceCompany: Company, amountAUD: number, ExchangeCenter: ExchangeCenter, acceptedCoins: Coin[]) {
        this.invoiceID = invoiceID;
        this.invoiceCompany = invoiceCompany;
        this.amountAUD = amountAUD;
        this.ExCenter = ExchangeCenter;
        this.acceptedCoins = acceptedCoins;
    }


    public async setupInvoice() {
        await this.getExchangeRates();
        await this.getDepositAddresses();
        return true;
    }
    /**
     * Used to generate the most up to exchange rates for the invoice amount.
     */
    public async getExchangeRates() {
        this.convertedRates = await this.ExCenter.getRatesFromAUD(this.amountAUD);
        this.lastConverted = new Date();
        return this.convertedRates;
    }


    /**
     * Used to generate invoice address IDs.
     */
    public async getDepositAddresses() {
        return new Promise(async (resolve) => {
            for(let i = 0, len = this.acceptedCoins.length; i < len; i++) {
                let server = this.acceptedCoins[i].getServer();
                //Fetch server session
                let NLServer = new NL_Server(server, database);
                let address = await NLServer.getNewAddress(this.invoiceID);
                this.depositAddresses[this.acceptedCoins[i].getSymbol()] = address['address'];
                if(i == len - 1) return resolve();
            }
        })
    }

    
}