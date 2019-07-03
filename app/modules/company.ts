export default class Company {

    private UUID:String;
    private name:String;
    private redirectAddresses: any;

    constructor(name:String, redirectAddresses:any){
        this.UUID = this.generateUUID();
        this.name = name;
        this.redirectAddresses = redirectAddresses;
    }


    /**
     * Will return the DB UUID of the company instance.
     * 12F47AS2
     * @returns {String} DB UUID
     */
    public getUUID():String {
        return this.UUID;
    }

    /**
     * Used to update the company UUID instance. 
     * @param uuid New UUID to update with
     */
    public setUUID(uuid:String) {
        this.UUID = uuid;
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


    private generateUUID() { // Public Domain/MIT
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    
}