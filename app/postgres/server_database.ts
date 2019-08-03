const _crypto = require("crypto");
const bcrypt = require('bcryptjs');
import {Pool} from 'pg';



export default class server_database {

    private pool : Pool;

    constructor(pool : Pool) {
        this.pool = pool;
    }


    /**
     * Creates the server table.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public createServerTable = () => {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.pool.query("CREATE TABLE servers(id serial PRIMARY KEY, server_id VARCHAR (355) UNIQUE NOT NULL, session VARCHAR(45) , key VARCHAR (60) NOT NULL, mac VARCHAR(45), banned VARCHAR(20) DEFAULT 'N', created_on TIMESTAMP NOT NULL, last_login TIMESTAMP NOT NULL);", (err:any, res:any) => {
                if (err) return resolve(false);
                return true;
            });
        });
    }

    /**
     * Creates server and returns access_key.
     * @returns {String} Either false or the [server_id, server_key].
     */
    public createServer = () => {
        var _this = this;
        return new Promise(async function(resolve, reject) {
            let server_id = "WEB-AU" + Math.floor(1000 + Math.random() * 9000);
            _crypto.randomBytes(30, async function(err:any, buffer:any) {
                let server_key = buffer.toString('base64');
                bcrypt.hash(server_key, 10).then(async (hash:string) => {
                    try {
                        await _this.pool.query("INSERT INTO servers(server_id, key, created_on, last_login) VALUES($1, $2, now(), now())", [server_id, hash]);
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
    public isSession = async (session:string): Promise<boolean> => {
        try {
            let { rows } = await this.pool.query('SELECT server_id, banned from servers where session=$1', [session]);
            if (rows[0] === undefined || rows.length === 0 || rows === null) {
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
    public loginServer = async (server_id:string, server_key:string) => {
        var _this = this;
        return  new Promise(async function(resolve, reject) {
            const client = await _this.pool.connect();
            try {
                await client.query('BEGIN');
                const { rows } = await client.query("SELECT key, banned from servers where server_id=$1", [server_id]);
                if(rows[0] === undefined || rows.length == 0 || rows == null){
                    await client.query('ROLLBACK');
                    resolve([false, "A"]);
                }else{
                    bcrypt.compare(server_key, rows[0].key).then(async (isValidated:boolean) => {
    
                        if (isValidated) {
                            if(rows[0].banned === 'Y'){
                                await client.query('ROLLBACK');
                                resolve([false, 'BANNED']);
                            }else{
                                _crypto.randomBytes(30, async function(err:any, buffer:any) {
                                    let session = buffer.toString('base64');
                                    await client.query("UPDATE servers SET session=$1 where server_id=$2", [session, server_id]);
                                    await client.query('COMMIT');
                                    resolve([true, session]);
                                });
                            }
                        }else{
                            await client.query('ROLLBACK');
                            resolve([false, "B"]);
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

    public getServer = async (serverIdent: string):Promise<any> =>  {
        var _this = this;
        return new Promise<any>((resolve) => {
            _this.pool.query(`SELECT session, host from servers where server_id = $1`, [serverIdent], (err:any, res:any) => {
                if(err) return resolve('');
                if(res.rows[0] === undefined || res.rows.length == 0 || res.rows == null) return resolve('');
                return resolve([res.rows[0].session, res.rows[0].host]);
            });
        });
    }


}