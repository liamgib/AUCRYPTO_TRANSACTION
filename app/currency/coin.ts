const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const sha256 = require('js-sha256');
const RIPEMD160 = require('ripemd160');
const bs58 = require('bs58');

export default class Coin {

    private addressPrefixs:Array<String>;
    private symbol:String;
    private name:String;

    constructor(symbol:String, name:String, addressPrefixs:Array<String>, ){
        this.addressPrefixs = addressPrefixs;
        this.symbol = symbol;
        this.name = name;
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
    public getSymbol():String {
        return this.symbol;
    }

    /**
     * Used to get the display name of the coin.
     */
    public getName():String {
        return this.name;
    }

    
}