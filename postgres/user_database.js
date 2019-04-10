const crypto = require("crypto");
const key = "d6733cd7h4559bff6a935408dbdb2620";
let iv = crypto.randomBytes(16);
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
        pool.query("CREATE TABLE users(user_id serial PRIMARY KEY, email VARCHAR (355) UNIQUE NOT NULL, password VARCHAR (50) NOT NULL, iv VARCHAR (50) NOT NULL, verifykey VARCHAR(45) NOT NULL, verifypin integer NOT NULL, verified VARCHAR(20) DEFAULT 'N', created_on TIMESTAMP NOT NULL, last_login TIMESTAMP);", (err, res) => {
            if (err) return resolve(false);
            return true;
        });
    });
}

module.exports.createSessionTable = () => {
    return promise = new Promise(function(resolve, reject) {
        pool.query("CREATE TABLE session(session VARCHAR(45) UNIQUE NOT NULL, user_id VARCHAR(45) NULL)", (err, res) => {
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
    password = module.exports.encrypt(password);
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const { rows } = await client.query("INSERT INTO users(email, password, iv, verifykey, verifypin, created_on, last_login) VALUES($1, $2, $3, $4, $5, now(), now()) RETURNING user_id", [email, password.encryptedData, password.iv, crypto.randomBytes(20).toString("hex"), Math.floor(1000 + Math.random() * 9000)]);
        await client.query('COMMIT');
        return rows[0].user_id;
      } catch (e) {
        await client.query('ROLLBACK')
        return false;
      } finally {
        client.release();
      }
}

/**
 * Used to login the user with a give email or password.
 * @param {String} email The associated accounts email address.
 * @param {String} password The associated accounts password.
 * @returns {Promise} ifLoggedIn, session_or_verifykey. 
 */
module.exports.loginUser = async (email, password) => {
    return promise = new Promise(async function(resolve, reject) {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const { rows } = await client.query("SELECT user_id, password, iv, verified, verifykey from users where email=$1 FOR UPDATE", [email]);
            if(rows[0] === undefined || rows.length == 0 || rows == null){
                await client.query('ROLLBACK');
                resolve([false]);
            }else{
                let depass = { iv: rows[0].iv, encryptedData: rows[0].password};
                depass = module.exports.decrypt(depass);
                if (depass === password) {
                    if(rows[0].verified === 'N'){
                        await client.query('ROLLBACK');
                        resolve([false, rows[0].verifykey]);
                    }else{
                        let session = crypto.randomBytes(16).toString("hex");
                        await client.query("INSERT INTO session(session, user_id) VALUES ($1, $2)", [session, rows[0].user_id]);
                        await client.query('COMMIT');
                        resolve([true, session]);
                    }
                }else{
                    await client.query('ROLLBACK');
                    resolve([false]);
                }
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
        await pool.query("UPDATE users SET verified='Y' where verifykey=$1 AND verifypin=$2", [verifykey, pin]);
        return true;
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


/**
 * Encrypt any information with a cipher.
 * @param {String} text The text to encrypt.
 * @returns {Object} Contains an object with .encryptedData (encrypted data) and .iv (assoiated iv)
 */
module.exports.encrypt = (text) => {
    let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    let biv = iv;
    iv = crypto.randomBytes(16);
    return { iv: biv.toString("hex"), encryptedData: encrypted.toString("hex") };
}
  
/**
 * Decrypts any information with a cipher.
 * @param {Object} text Object with .encryptedData and .iv
 * @returns {Object} Contains an object with .encrypted (encrypted data) and .iv (assoiated iv)
 */
module.exports.decrypt = (text) => {
    let iv = Buffer.from(text.iv, "hex");
    let encryptedText = Buffer.from(text.encryptedData, "hex");
    let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
  