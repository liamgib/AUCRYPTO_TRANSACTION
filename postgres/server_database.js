const crypto = require("crypto");
const bcrypt = require('bcrypt');
let pool;

module.exports = function main(poola){
    pool = poola;
    return module.exports;
}

/**
 * Creates the server table.
 * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
 */
module.exports.createServerTable = () => {
    return promise = new Promise(function(resolve, reject) {
        pool.query("CREATE TABLE servers(id serial PRIMARY KEY, server_id VARCHAR (355) UNIQUE NOT NULL, session VARCHAR(45) , key VARCHAR (60) NOT NULL, mac VARCHAR(45), banned VARCHAR(20) DEFAULT 'N', created_on TIMESTAMP NOT NULL, last_login TIMESTAMP NOT NULL);", (err, res) => {
            if (err) return resolve(false);
            return true;
        });
    });
}


/**
 * Creates server and returns access_key.
 * @returns {String} Either false or the [server_id, server_key].
 */
module.exports.createServer = () => {
    return promise = new Promise(async function(resolve, reject) {
        let server_id = "WEB-AU" + Math.floor(1000 + Math.random() * 9000);
        crypto.randomBytes(30, async function(err, buffer) {
            let server_key = buffer.toString('base64');
            bcrypt.hash(server_key, 10).then(async function(hash){
                try {
                    await pool.query("INSERT INTO servers(server_id, key, created_on, last_login) VALUES($1, $2, now(), now())", [server_id, hash]);
                    resolve([server_id, server_key]);
                } catch (e) {
                    resolve(false);
                }
            });
        });
    });
}

/**
 * Check the server session and if it's valid.
 * @param {String} session The server session to validate.
 * @return {Boolean} if the session is valid.
 */
module.exports.isSession = async (session) => {
    try {
        let { rows } = await pool.query('SELECT server_id, banned from servers where session=$1', [session]);
        if (rows[0] === undefined || rows.length === 0 || rows === null || user_id === undefined) {
            return false;
        } else {
            return rows[0].banned == 'N' ? true : false;
        }
    } catch(e) {
        return false;
    }
}

/**
  * Check if the server_id and key is correct, if so return session.
  * @param {String} server_id the server ID to authenticate.
  * @param {String} server_key the server key to authenticate.
  * @returns {Array} This contains an array with ifLoggedIn and the session key.
  */
 module.exports.loginServer = async (server_id, server_key) => {
    return promise = new Promise(async function(resolve, reject) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN')
            const { rows } = await client.query("SELECT key, banned from servers where server_id=$1", [server_id]);
            if(rows[0] === undefined || rows.length == 0 || rows == null){
                await client.query('ROLLBACK');
                resolve([false]);
            }else{
                bcrypt.compare(server_key, rows[0].key).then(async function(isValidated){

                    if (isValidated) {
                        if(rows[0].banned === 'Y'){
                            await client.query('ROLLBACK');
                            resolve([false, 'BANNED']);
                        }else{
                            crypto.randomBytes(30, async function(err, buffer) {
                                let session = buffer.toString('base64');
                                await client.query("UPDATE servers SET session=$1 where server_id=$2", [session, server_id]);
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