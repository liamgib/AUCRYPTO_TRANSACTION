import { Pool, Client } from 'pg';

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aucrypto',
    password: 'hf3hdi12fd_',
    port: 5432,
});


import userDatabase from './user_database';
const user_database = new userDatabase(pool);

import serverDatabase from './server_database';
const server_database = new serverDatabase(pool);

import currenciesDatabase from './currencies_database';
const currencies_database = new currenciesDatabase(pool);

export default class database_handler {

    /**
     * Checks to see if a table exists with the current database.
     * @param {String} table Table to check.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public doesTableExist = (table: string) => {
        return new Promise(function(resolve, reject) {
            pool.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2);', ['public', table], (err:any, res:any) => {
                if (err) return resolve(false);
                return resolve(res.rows[0].exists);
            });
        });
    }

    /**
     * Gets the user database instance manager.
     * @returns {user_database} The current database instance.
     */
    public getUserDatabase = ():userDatabase => {
        return user_database;
    }

    /**
     * Gets the servers database instance manager.
     * @returns {server_database} The current database instance.
     */
    public getServerDatabase = ():serverDatabase => {
        return server_database;
    }

    /**
     * Gets the servers database instance manager.
     * @returns {currencies_database} The current database instance.
     */
    public getCurrenciesDatabase = ():currenciesDatabase => {
        return currencies_database;
    }

    //        ----- SETUP FUNCTIONS ----

    /**
     * Check if session and users tables exists, if not create.
     */
    public setupUserDB = () => {
        this.doesTableExist('users').then((exists : boolean) => {
            if(!exists) this.getUserDatabase().createUserTable();
            this.doesTableExist('session').then((exists : boolean) => {
                if(!exists) this.getUserDatabase().createSessionTable();
                this.doesTableExist('currencies').then((exists : boolean) => {
                    if(!exists) this.getCurrenciesDatabase().createCurrenciesTable();
                    return true;
                });
            });
        });
    }

    /**
     * Check if the servers table exists, if not create.
     */
    public setupServersDB = () => {
        this.doesTableExist('servers').then((exists : boolean) => {
            if(!exists) this.getServerDatabase().createServerTable();
        });
    }

}