
export default class Coin {

    private addressPrefixs:Array<string>;
    private symbol:string;
    private name:string;
    private serverIdent:string;

    constructor(symbol:string, name:string, addressPrefixs:Array<string>, serverIdent:string){
        this.addressPrefixs = addressPrefixs;
        this.symbol = symbol;
        this.name = name;
        this.serverIdent = serverIdent;
    }


    /**
     * Used to validate an address... 
     */
    public getAddressPrefixs():Array<String> {
        return this.addressPrefixs
    }

    /**
     * Used to get the coin symbol code, eg 'BTC'/'LTC'/'NAH'
     */
    public getSymbol():string {
        return this.symbol;
    }

    /**
     * Used to get the display name of the coin.
     */
    public getName():string {
        return this.name;
    }


    /**
     * Will return the server ident of the NodeListener.
     */
    public getServer():string {
        return this.serverIdent;
    }

    
}