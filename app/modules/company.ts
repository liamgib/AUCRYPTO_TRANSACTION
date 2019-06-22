export default class Company {

    private UUID:String;
    private name:String;
    private redirectAddresses: any;

    constructor(UUID:String, name:String, redirectAddresses:any){
        this.UUID = UUID;
        this.name = name;
        this.redirectAddresses = redirectAddresses;
    }


    /**
     * Will return the DB UUID of the company instance.
     * @returns {String} DB UUID
     */
    public getUUID():String {
        return this.UUID;
    }


    /**
     * Will return the company name
     * @returns {String} Company name
     */
    public getName():String {
        return this.name;
    }

    /**
     * Will return the redirect addresses object for all of the enabled coins.
     */
    public getRedirectAddresses():Object {
        return this.redirectAddresses;
    }

    
    /**
     * Used to retreive the enabled coins for the company.
     * @returns {String[]} List of coin Symbols that are enabled. 
     */
    public getEnabledCoins():String[] {
        return Object.keys(this.redirectAddresses);
    }

    
    /**
     * Used to lookup a Redirect address given a coin symbol.
     * @param Symbol The coin symbol identifier
     * @returns {string} Will return the address else empty.
     */
    public getCoinRedirectAddress(Symbol:string) {
        return this.redirectAddresses[Symbol] === undefined ? '' : this.redirectAddresses[Symbol];
    }


    
}