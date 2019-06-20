import {Pool} from 'pg';
import Coin from '../currency/coin';

export default class server_database {

    private pool : Pool;

    constructor(pool : Pool) {
        this.pool = pool;
    }


    /**
     * Creates the currencies table.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public createCurrenciesTable = () => {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.pool.query(`CREATE TABLE public.currencies(symbol character varying(4) COLLATE pg_catalog."default" NOT NULL,name character varying(64) COLLATE pg_catalog."default","addressTypes" character varying(10)[] COLLATE pg_catalog."default",CONSTRAINT currencies_pkey PRIMARY KEY (symbol))`, (err:any, res:any) => {
                if (err){ console.log(err); return resolve(false); }
                return true;
            });
        });
    }

    public getCoins():Promise<Array<Coin>> {
        var _this = this;
        return new Promise<Array<Coin>>(function(resolve, reject) {
            let coins = Array<Coin>();
            _this.pool.query(`SELECT * from currencies`, (err:any, res:any) => {
                if(res.rowCount == 0) return resolve(coins);
                for(let i = 0, len = res.rows.length; i < len; i++){
                    coins.push(new Coin(res.rows[i].symbol, res.rows[i].name, res.rows[i].addressTypes));
                    if(i == len - 1) return resolve(coins);
                }
            });
        });
    }



}