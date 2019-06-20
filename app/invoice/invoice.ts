import Coin from '../currency/coin';

export default class Invoice {


    private amountAUD: Number;
    /* This value represent how much of the digital currency is equal to $1 AUD */
    private eachrateDollars: Number;
    private convertedTime: Date;
    private acceptCoins: Coin[];

}