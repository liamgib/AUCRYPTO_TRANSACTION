import {Pool} from 'pg';
import Invoice from '../invoice/invoice';
import companyDatabase from '../postgres/company_database';
import Coin from '../currency/coin';
import currenciesDatabase from './currencies_database';
import ExchangeCenter from '../currency/exchangecenter';

export default class server_database {

    private pool : Pool;
    private company_database:companyDatabase;
    private currencies_database:currenciesDatabase;
    private ExCenter:ExchangeCenter;

    constructor(pool : Pool, ExCenter: ExchangeCenter) {
        this.pool = pool;
        this.company_database = new companyDatabase(pool);
        this.currencies_database = new currenciesDatabase(pool);
        this.ExCenter = ExCenter;
    }


    /**
     * Creates the invoices table.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public createInvoicesTable = () => {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.pool.query(`CREATE TABLE public.invoices(id character varying(64) COLLATE pg_catalog."default" NOT NULL, company character varying(120) REFERENCES company (uuid),"amountAUD" numeric(18,8),"convertedTime" timestamp with time zone,"createdTime" time with time zone,"expireTime" time with time zone,"acceptedCoins" character varying(10)[] COLLATE pg_catalog."default","depositAddresses" jsonb[],"amountPaidAUD" numeric(18,8),"remainingAmountCoins" jsonb[],transactions character varying(100)[] COLLATE pg_catalog."default",status character varying(64) COLLATE pg_catalog."default",CONSTRAINT invoices_pkey PRIMARY KEY (id))`, (err:any, res:any) => {
                if (err){ console.log(err); return resolve(false); }
                return true;
            });
        });
    }

    /**
     * Used to create a new invoice record in the invoices table
     * @param invoice The invoice instance to import
     */
    public insertInvoice(invoice:Invoice) {
        var _this = this;
        return new Promise(async function(resolve, reject) {
            try  {
                await _this.pool.query("INSERT INTO invoices(id, company, amountaud, convertedtime, createdtime, acceptedcoins, depositaddresses, amountpaidaud, remainingamountcoins, totalamountcoins, transactions, status) VALUES($1, $2, $3, $4, now(), $5, $6, $7, $8, $9, $10, $11)", [invoice.getInvoiceID(), invoice.getCompany().getUUID(), invoice.getAmountAUD(), invoice.getConvertedTime(), invoice.getAcceptedCoinsString(), invoice.getDepositAddresses(), 0, invoice.getRemainingAmountCoins(), invoice.getRemainingAmountCoins(), [], 'PENDING']);
                return resolve(true);
            } catch (e) {
                console.log(e);
                return resolve(false);
            }
        });
    }

    /**
     * Used to get an invoice instance from the databsae given the invoice ID.
     * @param invoiceID Invoice id to lookup
     */
    public getInvoiceFromID(invoiceID:string):Promise<Invoice> {    
        var _this = this;
        return new Promise(async function(resolve, reject) {
            try  {
                await _this.pool.query("select * from invoices where id=$1", [invoiceID], async (err:any, res:any) => {
                    if(res.rowCount == 0) return resolve(null);
                    let comp = await _this.company_database.getCompany(res.rows[0].company);
                    if(comp == null) return resolve(null);
                    let coins:Coin[] = []
                    for(let i = 0, len = Object.keys(res.rows[0].depositaddresses).length; i < len; i++) {
                        coins.push(await _this.currencies_database.getCoinFromSymbol(Object.keys(res.rows[0].depositaddresses)[i]))
                        if(i == len - 1) {
                            let invoice = new Invoice(comp, parseFloat(res.rows[0].amountaud), _this.ExCenter, coins);
                            invoice.setDepositAddresses(res.rows[0].depositaddresses);
                            invoice.setConvertedRates(res.rows[0].remainingamountcoins);
                            invoice.setTotalAmountCoins(res.rows[0].totalamountcoins);
                            return resolve(invoice);
                        }
                    }
                });
            } catch (e) {
                console.log(e);
                return resolve(null);
            }
        });
    }




}