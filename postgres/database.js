const { Pool, Client } = require('pg')
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aucrypto',
    password: 'hf3hdi12fd_',
    port: 5432,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
});


//      -=- Table functions -=-

/**
 * Checks to see if a table exists with the current database.
 * @param {String} table Table to check.
 * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
 */
module.exports.doesTableExist = function(table){
    return promise = new Promise(function(resolve, reject) {
        pool.query('SELECT EXISTS (SELECT 1 FROM   information_schema.tables WHERE  table_schema = $1 AND table_name = $2);', ['public', table], (err, res) => {
            if (err) return resolve(false);
            return resolve(res.rows[0].exists);
        });
    });
}


/**
 * Creates the user tables.
 * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
 */
module.exports.createUserTable = function createUserTable(){
    return promise = new Promise(function(resolve, reject) {
        pool.query('CREATE TABLE users(user_id serial PRIMARY KEY,username VARCHAR (50) UNIQUE NOT NULL,password VARCHAR (50) NOT NULL, email VARCHAR (355) UNIQUE NOT NULL, created_on TIMESTAMP NOT NULL,last_login TIMESTAMP);', (err, res) => {
            if (err) return resolve(false);
            return true;
        });
    });
}