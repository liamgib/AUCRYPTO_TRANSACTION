import {Pool} from 'pg';
import company from '../modules/company';
import { resolve } from 'path';
import Company from '../modules/company';

export default class company_database {

    private pool : Pool;

    constructor(pool : Pool) {
        this.pool = pool;
    }


    /**
     * Creates the company table.
     * @returns {promise} Returns a promise, which resolves as true or false depending on the result. 
     */
    public createCompanyTable = () => {
        var _this = this;
        return new Promise(function(resolve, reject) {
            _this.pool.query(`CREATE TABLE public.company
            (
                uuid character varying(64) COLLATE pg_catalog."default" NOT NULL,
                name character varying(120) COLLATE pg_catalog."default",
                redirectaddresses jsonb,
                enabledcoins character varying(16)[] COLLATE pg_catalog."default",
                apiclient character varying(120) COLLATE pg_catalog."default",
                CONSTRAINT company_pkey PRIMARY KEY (uuid),
                CONSTRAINT company_api FOREIGN KEY (apiclient)
                    REFERENCES public.apikeys (api_client) MATCH SIMPLE
                    ON UPDATE NO ACTION
                    ON DELETE NO ACTION
            )`, (err:any, res:any) => {
                if (err){ console.log(err); return resolve(false); }
                return true;
            });
        });
    }


    /**
     * Used to create a new record in the company table
     * @param company The company instance to insert
     */
    public insertCompany(company:company) {
        var _this = this;
        return new Promise(async function(resolve, reject) {
            try  {
                await _this.pool.query("INSERT INTO company(uuid, name, redirectaddresses, enabledcoins) VALUES($1, $2, $3, $4)", [company.getUUID(), company.getName(), company.getRedirectAddresses(), company.getEnabledCoins()]);
                return resolve(true);
            } catch (e) {
                console.log(e);
                return resolve(false);
            }
        });
    }

    /**
     * Will lookup a company instance with a company ID
     * @param companyId The Company ID to lookup with
     */
    public getCompany(companyId:string): Promise<company> {
        var _this = this;
        return new Promise<company>(async (resolve, reject) => {
            try  {
                await _this.pool.query("select * from company where uuid=$1", [companyId], (err:any, res:any) => {
                    if(res.rowCount == 0) return resolve(null);
                    let comp = new Company(res.rows[0].name, res.rows[0].redirectaddresses);
                    comp.setUUID(res.rows[0].uuid);
                    comp.setAPIClient(res.rows[0].apiclient);
                    return resolve(comp);
                });
            } catch (e) {
                console.log(e);
                return resolve(null);
            }
        });
    }

    /**
     * Will lookup a company instance with a API Client Identifier.
     * @param {String} APIClient The API Client Identifier
     */
    public getCompanyWithAPIClient(APIClient:String): Promise<company> {
        var _this = this;
        return new Promise<company>(async (resolve, reject) => {
            try  {
                await _this.pool.query("select * from company where apiclient=$1", [APIClient], (err:any, res:any) => {
                    if(res.rowCount == 0) return resolve(null);
                    let comp = new Company(res.rows[0].name, res.rows[0].redirectAddresses);
                    comp.setUUID(res.rows[0].uuid);
                    comp.setAPIClient(res.rows[0].apiclient);
                    return resolve(comp);
                });
            } catch (e) {
                console.log(e);
                return resolve(null);
            }
        });

    }




}