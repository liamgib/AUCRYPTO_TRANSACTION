
export default class ExchangeCenter {


    private rates:any = {
        'NAH': 0.0016,
        'BTC': 13364.82
    };

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
}