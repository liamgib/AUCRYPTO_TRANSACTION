import {Pool} from 'pg';
import Coin from '../currency/coin';

export default class server_database {

    private pool : Pool;

    constructor(pool : Pool) {
        this.pool = pool;
    }


    /**
     * Creates the invoices table.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public createInvoicesTable = () => {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.pool.query(`CREATE TABLE public.invoices(id character varying(64) COLLATE pg_catalog."default" NOT NULL, company character varying(120) COLLATE pg_catalog."default","amountAUD" numeric(18,8),"convertedTime" timestamp with time zone,"createdTime" time with time zone,"expireTime" time with time zone,"acceptedCoins" character varying(10)[] COLLATE pg_catalog."default","depositAddresses" jsonb[],"amountPaidAUD" numeric(18,8),"remainingAmountCoins" jsonb[],transactions character varying(100)[] COLLATE pg_catalog."default",status character varying(64) COLLATE pg_catalog."default",CONSTRAINT invoices_pkey PRIMARY KEY (id))`, (err:any, res:any) => {
                if (err){ console.log(err); return resolve(false); }
                return true;
            });
        });
    }




}