const { Pool, Client } = require('pg')
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aucrypto',
    password: 'hf3hdi12fd_',
    port: 5432,
});

const user_database = require('./user_database');
const server_database = require('./server_database');

//      -=- Table functions -=-

/**
 * Checks to see if a table exists with the current database.
 * @param {String} table Table to check.
 * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
 */
module.exports.doesTableExist = (table) => {
    return promise = new Promise(function(resolve, reject) {
        pool.query('SELECT EXISTS (SELECT 1 FROM   information_schema.tables WHERE  table_schema = $1 AND table_name = $2);', ['public', table], (err, res) => {
            if (err) return resolve(false);
            return resolve(res.rows[0].exists);
        });
    });
}


/**
 * Gets the user database instance manager.
 * @returns {user_database} The current database instance.
 */
module.exports.getUserDatabase = () => {
    return user_database(pool);
}

/**
 * Gets the servers database instance manager.
 * @returns {server_database} The current database instance.
 */
module.exports.getServerDatabase = () => {
    return server_database(pool);
}


//        ----- SETUP FUNCTIONS ----

/**
 * Check if session and users tables exists, if not create.
 */
module.exports.setupUserDB = () => {
    module.exports.doesTableExist('users').then(exists => {
        if(!exists) module.exports.getUserDatabase().createUserTable();
        module.exports.doesTableExist('session').then(exists => {
            if(!exists) module.exports.getUserDatabase().createSessionTable();
            return true;
        });
    });
}

/**
 * Check if the servers table exists, if not create.
 */
module.exports.setupServersDB = () => {
    module.exports.doesTableExist('servers').then(exists => {
        if(!exists) module.exports.getServerDatabase().createServerTable();
    });
}
