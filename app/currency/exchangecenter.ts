
const fetch = require('node-fetch');
export default class ExchangeCenter {


    /**
     * Rate is in AUD
     */
    private rates:any = {
        'NAH': 0.0016
    };

    private BTC_AUD = 0.00;

    public getRates():any {
        return this.rates;
    }

    public getRatesFromAUD(amountAUD:number):Promise<any> {
        return new Promise<any>((resolve) => {
            let calculatedRates: any = {};
            for(let i = 0, len = Object.keys(this.rates).length; i < len; i++) {
                calculatedRates[Object.keys(this.rates)[i]] = {
                    rate: this.rates[Object.keys(this.rates)[i]],
                    value: amountAUD / this.rates[Object.keys(this.rates)[i]]
                }
                if(i == len - 1) return resolve(calculatedRates);
            }
        });
    }

    public async startPriceHeartBeat() {
        setInterval(async () => {
            await this.calculateRates();
        }, 1000 * 60 ^ 5);
    }

    public async calculateRates() {
        await fetch(`https://blockchain.info/ticker`, {
                method: 'get',
                headers: { 'Content-Type': 'application/json' }
            }).then((res:any) => res.json())
            .then((json:any) => {
                this.BTC_AUD = json.AUD.last;
            }).catch((err:any) => {
                return false;
            });
            
            await fetch(`https://tradeogre.com/api/v1/markets`, {
                method: 'get',
                headers: { 'Content-Type': 'application/json' }
            }).then((res:any) => res.json())
            .then((json:any) => {
                for(let i = 0; i < json.length; i++) {
                    let coinData = Object.keys(json[i])[0];
                    let coin = coinData.split('-');
                    if(coin[0] == 'BTC') {
                        if(Object.keys(this.rates).includes(coin[1])) {
                            let priceBTC = parseFloat(json[i][`BTC-${coin[1]}`].price);
                            this.rates[coin[1]] = this.BTC_AUD * priceBTC;
                        }
                    }
                }
            }).catch((err:any) => {
                return false;
            });
    }
}