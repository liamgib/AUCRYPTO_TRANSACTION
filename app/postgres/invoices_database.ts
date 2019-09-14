import {Pool, PoolClient} from 'pg';
import Invoice from '../invoice/invoice';
import companyDatabase from '../postgres/company_database';
import Coin from '../currency/coin';
import currenciesDatabase from './currencies_database';
import ExchangeCenter from '../currency/exchangecenter';
import Company from '../modules/company';

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
            _this.pool.query(`CREATE TABLE public.invoices
            (
                id character varying(64) COLLATE pg_catalog."default" NOT NULL,
                company character varying(120) COLLATE pg_catalog."default",
                amountaud numeric(18,8),
                convertedtime timestamp with time zone,
                expiretime time with time zone,
                acceptedcoins character varying(10)[] COLLATE pg_catalog."default",
                amountpaidaud numeric(18,8),
                transactions character varying(100)[] COLLATE pg_catalog."default",
                status character varying(64) COLLATE pg_catalog."default",
                depositaddresses jsonb,
                remainingamountcoins jsonb,
                totalamountcoins jsonb,
                acceptedminimumdeposit character varying(11) COLLATE pg_catalog."default",
                lastpaidtime timestamp with time zone,
                createdtime timestamp with time zone,
                paymenttransactions character varying(100)[] COLLATE pg_catalog."default",
                CONSTRAINT invoices_pkey PRIMARY KEY (id),
                CONSTRAINT invoices_company_fkey FOREIGN KEY (company)
                    REFERENCES public.company (uuid) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
            )`, (err:any, res:any) => {
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
            if(invoice.getDepositAddresses() == {} || invoice.getDepositAddresses() == undefined) return resolve(false);
            try  {
                await _this.pool.query("INSERT INTO invoices(id, company, amountaud, convertedtime, createdtime, acceptedcoins, depositaddresses, amountpaidaud, remainingamountcoins, totalamountcoins, transactions, status, acceptedminimumdeposit, lastpaidtime, paymenttransactions) VALUES($1, $2, $3, $4, now(), $5, $6, $7, $8, $9, $10, $11, $12, now(), $13)", [invoice.getInvoiceID(), invoice.getCompany().getUUID(), invoice.getAmountAUD(), invoice.getConvertedTime(), invoice.getAcceptedCoinsString(), invoice.getDepositAddresses(), 0, invoice.getRemainingAmountCoins(), invoice.getRemainingAmountCoins(), [], invoice.getStatus(), invoice.getAcceptedMinimumDeposit(), []]);
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
                            invoice.setRemainingAmounts(res.rows[0].remainingamountcoins);
                            invoice.setTotalAmountCoins(res.rows[0].totalamountcoins);
                            invoice.setAcceptedMinimumDeposit(res.rows[0].acceptedminimumdeposit);
                            invoice.setStatus(res.rows[0].status);
                            invoice.setAmountPaidAUD(parseFloat(res.rows[0].amountpaidaud));
                            invoice.setTransactions(res.rows[0].transactions);
                            invoice.setInvoiceID(res.rows[0].id);
                            invoice.setLastPaidTime(res.rows[0].lastpaidtime);
                            invoice.setPaymentTransactionIds(res.rows[0].paymenttransactions);
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

    /**
     * Used to get an invoice instance from the database given the invoice ID.
     * WILL LOCK THE ROW WITH THE CLIENT RETURNED IN INDEX 1.
     * ENSURE YOU ROLLBACK OR COMMIT TRANSACTION.
     * @param invoiceID Invoice id to lookup
     */
    public getInvoiceFromIDWithLOCK(invoiceID:string):Promise<[Invoice, PoolClient]> {    
        var _this = this;
        return new Promise(async function(resolve, reject) {
            const client = await _this.pool.connect();
            try {
                await client.query('BEGIN')
                await client.query("select * from invoices where id=$1 FOR UPDATE", [invoiceID], async (err:any, res:any) => {
                    if(res.rowCount == 0) { await client.query('ROLLBACK'); return resolve(); };
                    let comp = await _this.company_database.getCompany(res.rows[0].company);
                    if(comp == null) { await client.query('ROLLBACK'); return resolve(); };
                    let coins:Coin[] = []
                    for(let i = 0, len = Object.keys(res.rows[0].depositaddresses).length; i < len; i++) {
                        coins.push(await _this.currencies_database.getCoinFromSymbol(Object.keys(res.rows[0].depositaddresses)[i]))
                        if(i == len - 1) {
                            let invoice = new Invoice(comp, parseFloat(res.rows[0].amountaud), _this.ExCenter, coins);
                            invoice.setDepositAddresses(res.rows[0].depositaddresses);
                            invoice.setRemainingAmounts(res.rows[0].remainingamountcoins);
                            invoice.setTotalAmountCoins(res.rows[0].totalamountcoins);
                            invoice.setAcceptedMinimumDeposit(res.rows[0].acceptedminimumdeposit);
                            invoice.setStatus(res.rows[0].status);
                            invoice.setAmountPaidAUD(parseFloat(res.rows[0].amountpaidaud));
                            invoice.setTransactions(res.rows[0].transactions);
                            invoice.setInvoiceID(res.rows[0].id);
                            invoice.setLastPaidTime(res.rows[0].lastpaidtime);
                            invoice.setPaymentTransactionIds(res.rows[0].paymenttransactions);
                            return resolve([invoice, client]);
                        }
                    }
                });
            } catch (e) {
                console.log(e);
                await client.query('ROLLBACK');
                return resolve();
            }
        });
    }

    /**
     * Invoice to update
     * @param invoice The invoice to update
     */
    public updateInvoice(invoice:Invoice, poolClient:PoolClient){
        var _this = this;
        return new Promise(async function(resolve, reject) {
            let client = undefined;
            let isPassed = false;
            if(poolClient !== undefined) isPassed = true;
            if(poolClient !== undefined) client = poolClient;
            if(poolClient == undefined) await _this.pool.connect();
            try {
                if(!isPassed) await poolClient.query('BEGIN');
                await client.query("UPDATE invoices SET amountpaidaud=$1, status=$2, remainingamountcoins=$3, transactions=$4, lastpaidtime=$5, paymenttransactions=$6 where id=$7", [invoice.getAmountPaidAUD(), invoice.getStatus(), invoice.getRemainingAmountCoins(), invoice.getTransactions(), invoice.getLastPaidTime(), invoice.getPaymentTransactionIDs(), invoice.getInvoiceID()]);
                await client.query('COMMIT');
                return resolve(true);
            } catch (e) {
                console.log(e);
                if(!isPassed) await client.query('ROLLBACK');
                return resolve(false);
            } finally {
                if(poolClient == undefined) client.release();
            }
        });
    }


    public getCompanyInvoices(comp:Company){
        var _this = this;
        return new Promise(async function(resolve, reject) {
            try {
                let { rows } = await _this.pool.query('SELECT id, status, amountaud, amountpaidaud, acceptedminimumdeposit, createdtime, lastpaidtime, depositaddresses, remainingamountcoins from invoices where company = $1 order by createdtime desc', [comp.getUUID()]);
                if (rows[0] === undefined || rows.length === 0 || rows === null) {
                    return resolve(false);
                } else {
                    return resolve(rows);
                }
            } catch(e) {
                console.log(e);
                return resolve(false);
            }
        });
    }

    public getCompanyInvoice(comp:Company, invoiceID:string) {
        var _this = this;
        return new Promise(async function(resolve, reject) {
            try {
                let { rows } = await _this.pool.query('SELECT id, status, amountaud, amountpaidaud, acceptedminimumdeposit, createdtime, lastpaidtime, transactions, depositaddresses, remainingamountcoins, paymenttransactions from invoices where company = $1 and id = $2 order by createdtime desc', [comp.getUUID(), invoiceID]);
                if (rows[0] === undefined || rows.length === 0 || rows === null) {
                    return resolve({error: "Unable to locate invoice ID", code: "INVALID-INVOICE"});
                } else {
                    return resolve(rows);
                }
            } catch(e) {
                console.log(e);
                return resolve({error: "Unable to locate invoice ID", code: "INVALID-INVOICE"});
            }
        });
    }




}