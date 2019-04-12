const crypto = require("crypto");
const bcrypt = require('bcrypt');
let pool;

module.exports = function main(poola){
    pool = poola;
    return module.exports;
}

/**
 * Creates the user tables.
 * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
 */
module.exports.createUserTable = () => {
    return promise = new Promise(function(resolve, reject) {
        pool.query("CREATE TABLE users(user_id serial PRIMARY KEY, email VARCHAR (355) UNIQUE NOT NULL, password VARCHAR (60) NOT NULL, useragent VARHCAR(60) NOT NULL, verifykey VARCHAR(45) NOT NULL, verifypin integer NOT NULL, verified VARCHAR(20) DEFAULT 'N', created_on TIMESTAMP NOT NULL, last_login TIMESTAMP);", (err, res) => {
            if (err) return resolve(false);
            return true;
        });
    });
}

module.exports.createSessionTable = () => {
    return promise = new Promise(function(resolve, reject) {
        pool.query("CREATE TABLE session(session VARCHAR(45) UNIQUE NOT NULL, user_id VARCHAR(45) NULL, created_on TIMESTAMP NOT NULL)", (err, res) => {
            if (err) return resolve(false);
            return true;
        });
    });
}


//      -=- User functions -=-

/**
 * Create user with email and password. The password is encrypted.
 * @param {String} email The email for the associated account.
 * @param {String} password The password for the account.
 * @returns {Promise} Returns a promise which resolves to false if a error occured or to a user_id.
 */
module.exports.createUser = async (email, password) => {
    return promise = new Promise(async function(resolve, reject) {
        bcrypt.hash(password, 10).then(async function(hash){
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const { rows } = await client.query("INSERT INTO users(email, password, verifykey, verifypin, created_on, last_login) VALUES($1, $2, $3, $4, now(), now()) RETURNING user_id", [email, hash, crypto.randomBytes(20).toString("hex"), Math.floor(1000 + Math.random() * 9000)]);
            await client.query('COMMIT');
            resolve(rows[0].user_id);
        } catch (e) {
            await client.query('ROLLBACK')
            resolve(false);
        } finally {
            client.release();
        }
        });
    });
}

module.exports.deleteUser = async (email) => {
    return promise = new Promise(async function(resolve, reject) {
        try {
            const res = await pool.query("DELETE from users WHERE email=$1", [email]);
            resolve((res.rowCount == 0) ? false : true);
        } catch (e) {
            resolve(false);
        }
        
    });
}

/**
 * Used to login the user with a give email or password.
 * @param {String} email The associated accounts email address.
 * @param {String} password The associated accounts password.
 * @returns {Promise} ifLoggedIn, session_or_verifykey. 
 */
module.exports.loginUser = async (email, password) => {
    return promise = new Promise(async function(resolve, reject) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { rows } = await client.query("SELECT user_id, password, verified, verifykey, verifypin from users where email=$1", [email]);
            if(rows[0] === undefined || rows.length == 0 || rows == null){
                await client.query('ROLLBACK');
                resolve([false]);
            }else{
                bcrypt.compare(password, rows[0].password).then(async function(isValidated){

                    if (isValidated) {
                        if(rows[0].verified === 'N'){
                            await client.query('ROLLBACK');
                            resolve([false, rows[0].verifykey, rows[0].verifypin]);
                        }else{
                            crypto.randomBytes(30, async function(err, buffer) {
                                let session = buffer.toString('base64');
                                await client.query("INSERT INTO session(session, user_id, created_on) VALUES ($1, $2, now())", [session, rows[0].user_id]);
                                await client.query('COMMIT');
                                resolve([true, session]);
                            });
                        }
                    }else{
                        await client.query('ROLLBACK');
                        resolve([false]);
                    }
                })
            }
        } catch (e) {
        await client.query('ROLLBACK')
        return ([false]);
        } finally {
        client.release();
        }
    }).catch();
}

/**
 * Verify a user account, give then verifykey and pin.
 * @param {String} verifykey The given verifiykey for the user.
 * @param {String} pin The pin to verify the user. 
 * @returns {Boolean} Returns a async boolean, true or false if complete.
 */
module.exports.userVerification = async (verifykey, pin) => {
    try {
        const res = await pool.query("UPDATE users SET verified='Y' where verifykey=$1 AND verifypin=$2", [verifykey, pin]);
        return (res.rowCount == 0) ? false : true;
    } catch(e) {
        return false;
    }
}


/**
 * Check if an email exists, if so return true or false.
 * @param {String} email The email to search for
 * @returns {Promise} Returns a promise that resolves
 */
module.exports.doesEmailExist = async (email) => {
    try {
    const { rows } = await pool.query('SELECT user_id from users where email=$1', [email]);
        if (rows[0] === undefined || rows.length == 0 || rows == null) {
            return false;
        } else {
            return true;
        }
    } catch(e) {
        return false;
    }
}

/**
 * Checks if a session is valid, returns true if so.
 * @param {String} session The session to check.
 * @returns {Booleaan} Returns a async boolean as true or false.
 */
module.exports.isSession = async (session) => {
    try {
        let { rows } = await pool.query('SELECT user_id from session where session=$1', [session]);
        let user_id = rows[0].user_id;
        if (rows[0] === undefined || rows.length === 0 || rows === null || user_id === undefined) {
            return false;
        } else {
            let { rows } = await pool.query('SELECT verified from users where user_id=$1', [user_id]);
            if (rows[0] === undefined || rows.length[0] == 0 || rows == null) {
                return false;
            } else {
                return rows[0].verified == 'Y' ? true : false;
            }
        }
    } catch(e) {
        return false;
    }
}

