const Binance = require('node-binance-api');
const Exchange = require('./Exchange');
const Decimal = require('decimal.js')
var loops = 0
const BUDGET = "15"
const FEERate = "0.000"

module.exports = async function (BASE_USD_BUDGET = BUDGET, FEE = FEERate) {
	const tickers = await Exchange.getTickersData();
	const marketsData = await Exchange.getMarketsData();
	const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
	const binance = new Binance().options({
		APIKEY: 'PuancJFxD9kZy90iOZOB24FlSzHxXlJLweikBfVQXVm22QUMDvpN8Bl6W5xzrjop',
		APISECRET: 'hj7XYKSwfVgREKKBZbd5X7JvtJI9XgVX1z22YIhSdehzl7yzw1LXrioDLJmX4MBt',
		'family': 4,
	})

	const exchangeInfo = await binance.exchangeInfo();
	var parcenbet = 80
	const getValidQuantity = (floatNumber, lotSize) => {
		const n = lotSize.split('.')[1]?.indexOf('1') + 1;
		return toFixedWithoutRounding(floatNumber, n);
	}

	const toFixedWithoutRounding = (floatNumber, n) => {
		const x = Math.pow(10, n);
		return parseFloat(
			(parseInt(floatNumber * x) / x).toFixed(n)
		);
	}

	//while (true) {await sleep(55);}
	
	function baseBudget(coin, markets) {
		const BASE_USD_BUDGET = checkProfit.BASE_USD_BUDGET;

		const stables = 'USDT,USDC,BUSD,DAI,PAX'.split(',');

		let symbol = '';
		if (stables.indexOf(coin) > -1) {
			return new Decimal(BASE_USD_BUDGET);
		}
		for (let i = 0; i < stables.length; i += 1) {
			const stable = stables[i];
			const p1Stable = `${coin}/${stable}`;
			const stablep2 = `${stable}/${coin}`;

			if (marketsData[p1Stable] && markets[p1Stable]) {
				symbol = p1Stable;

				return (new Decimal(BASE_USD_BUDGET))
					.div(markets[symbol].bidPrice)
					.toDecimalPlaces(marketsData[symbol].precision.amount, Decimal.ROUND_DOWN);
			}
			if (marketsData[stablep2] && markets[stablep2]) {
				symbol = stablep2;
				return (new Decimal(BASE_USD_BUDGET))
					.mul(markets[symbol].bidPrice)
					.toDecimalPlaces(marketsData[symbol].precision.quote, Decimal.ROUND_DOWN);
			}
		}

		for (let i = 0; i < stables.length; i += 1) {
			const stable = stables[i];
			const p1Stable = `${coin}/${stable}`;
			const stablep2 = `${stable}/${coin}`;
			if (marketsData[p1Stable] && tickers[p1Stable]) {
				symbol = p1Stable;

				return (new Decimal(BASE_USD_BUDGET))
					.div(tickers[symbol].bid)
					.toDecimalPlaces(marketsData[symbol].precision.amount, Decimal.ROUND_DOWN);
			}
			if (marketsData[stablep2] && tickers[stablep2]) {
				symbol = stablep2;
				return (new Decimal(BASE_USD_BUDGET))
					.mul(tickers[symbol].bid)
					.toDecimalPlaces(marketsData[symbol].precision.quote, Decimal.ROUND_DOWN);
			}
		}

		throw new Error(`no budget price for ${coin}`);
	}

	async function checkProfit(pairsToTest, markets) {
		const ret = [];
		const winners = [];	

		let startBuying = undefined
		let oldOlderData = undefined
		let waitOrder = undefined

		for (let j = 0; j < pairsToTest.length; j += 1) {

			const chain = pairsToTest[j];
			let initialBudget;
			try {
				initialBudget = new Decimal(baseBudget(chain[0], markets));
			} catch (er) {
				continue;
			}
			let budget = initialBudget;
			const orders = [];
			const log = [];
			const percen = [];
			let fail = false;
			for (let i = 0; i < 3; i += 1) {
				const p12 = [chain[i], chain[i + 1]].join('');
				const p12_1 = [chain[i], chain[i + 1]].join('/');
				const p21 = [chain[i + 1], chain[i]].join('');
				const p21_1 = [chain[i + 1], chain[i]].join('/');
				log.push(budget + chain[i]);
				if (markets[p12] && marketsData[p12_1]) {
					if (!markets[p12].bidPrice) {
						fail = true;
						break;
					}
					const bidPrice = Decimal(markets[p12].bidPrice)
						.toDecimalPlaces(marketsData[p12_1].precision.price, Decimal.ROUND_DOWN);
					budget = budget.toDecimalPlaces(marketsData[p12_1].precision.amount, Decimal.ROUND_DOWN);

					var parc = 0;
					if (parseFloat(markets[p12].bidQty) >= budget.toFixed(8)) {
						parc = 100;
					} else {
						var valuepercen = (parseFloat(markets[p12].bidQty) * 100) / budget.toFixed(8);
						parc = Math.floor(valuepercen);
					}
					if (parc < parcenbet) {
						fail = true;
						break;
					}
					percen.push(parc);

					orders.push({
						market: p12_1,
						side: 'sell',
						amount: budget,
						price: bidPrice,
						link: `https://www.binance.com/en/trade/${p12_1.replace('/', '_')}`,
						total: budget.mul(bidPrice).toDecimalPlaces(marketsData[p12_1].precision.quote, Decimal.ROUND_DOWN),
					});

					budget = budget.mul(bidPrice);

					log.push(JSON.stringify({
						n: p12_1,
						p: markets[p12]
					}));
				} else if (markets[p21] && marketsData[p21_1]) {
					if (!markets[p21].askPrice) {
						fail = true;
						break;
					}
					const askPrice = Decimal(markets[p21].askPrice).toDecimalPlaces(marketsData[p21_1].precision.price, Decimal.ROUND_DOWN);
					const prevBudget = budget;
					budget = budget.div(askPrice)
						.toDecimalPlaces(marketsData[p21_1].precision.amount, Decimal.ROUND_DOWN);

					var parc = 0;
					if (parseFloat(markets[p21].askQty) >= budget.toFixed(8)) {
						parc = 100;
					} else {
						var valuepercen = (parseFloat(markets[p21].askQty) * 100) / budget.toFixed(8);
						parc = Math.floor(valuepercen);
					}
					if (parc < parcenbet) {
						fail = true;
						break;
					}
					percen.push(parc);

					orders.push({
						market: p21_1,
						side: 'buy',
						amount: budget,
						price: askPrice,
						link: `https://www.binance.com/en/trade/${p21_1.replace('/', '_')}`,
						total: prevBudget.toDecimalPlaces(marketsData[p21_1].precision.quote, Decimal.ROUND_DOWN),
					});

				} else {
					fail = true;
					break;
				}
			}
			if (!fail) {
				const fee = Decimal(checkProfit.FEE).mul(3);
				const profit = budget.div(initialBudget).sub(fee);				
				let profitTable = profit.sub(1).mul(100).toFixed(4)			
				
				if (loops === 0) {					
					var budgetsx = (orders[1].amount).toFixed(8)*(orders[1].price).toFixed(8) //ราคาเริ่มต้น
					var amuntcheck = orders[1].amount.toFixed(8)
					var percensx = amuntcheck*0.001
					amuntcheck = amuntcheck-percensx				
					var _exchangeInfo_ = exchangeInfo.symbols.find(el => el.symbol === orders[2].market.replace('/', ''));
					if (_exchangeInfo_.filters[2].minQty === '1.00000000') {
						amuntcheck = Math.floor(amuntcheck)
					} else {
						amuntcheck = getValidQuantity(amuntcheck, _exchangeInfo_.filters[2].minQty)
					}
					
					amuntcheck = amuntcheck*orders[2].price.toFixed(8)
					amuntcheck = amuntcheck-budgetsx				
					if (amuntcheck > 0.0100) {
						loops = 1						
						console.log(chain)	
						console.log(' Profit : ' + amuntcheck.toFixed(4) + ' Fee : ' + fee.toFixed(4) + ' Amount : ' + percen[0] + "%")
						
						var ascOrder = percen.sort((a, b) => a > b ? 1 : -1);
						var budgets = BUDGET;
						var orderIdnew = 0;
						
						while (true) {				
							const resulbalnce = await binance.balance();
							let _balances = parseFloat(resulbalnce['USDT'].available)
							if (parseFloat(_balances).toFixed(8) < (parseFloat(budgets)-1)){
								binance.marketSell(orders[0].market.replace('/', ''), Math.floor(BUDGET));
							}
							
							var price = (orders[1].price).toFixed(8);
							var amount = (orders[1].amount).toFixed(8)
							amount = (percen[0]/100)*parseFloat(amount)						
							var _exchangeInfo = exchangeInfo.symbols.find(el => el.symbol === orders[1].market.replace('/', ''));
							if (_exchangeInfo.filters[2].minQty === '1.00000000') {
								amount = Math.floor(amount)
							} else {
								amount = getValidQuantity(amount, _exchangeInfo.filters[2].minQty)
							}

							waitOrder = orders[1].market.replace('/', '')
							binance.buy(waitOrder, parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {																
								orderIdnew = response.orderId;
								waitOrder = undefined
							})									
							if (waitOrder !== undefined) {
								while (true) {
									if (waitOrder === undefined){
										break
									}
									await sleep(5);
								}
							}
										
							const resulxxx = await binance.balance();
							orderIdnew = 0;
							amount = parseFloat(resulxxx[chain[2]].available)
							_exchangeInfo = exchangeInfo.symbols.find(el => el.symbol === orders[2].market.replace('/', ''));
							if (_exchangeInfo.filters[2].minQty === '1.00000000') {
								amount = Math.floor(amount)
							} else {
								amount = getValidQuantity(amount, _exchangeInfo.filters[2].minQty)
							}
							
							price = orders[2].price.toFixed(8)
							console.log(price)	
							var exchange_ = exchangeInfo.symbols.find(el => el.symbol === orders[2].market.replace('/', ''));
							var bestp = parseFloat(exchange_.filters[0].tickSize)
							var newprics = price
							
							for (let i = 0; i < 100; i += 1) {
								newprics = (newprics-bestp)								
								if (exchange_.filters[0].tickSize === '1.00000000') {
									newprics = Math.floor(newprics)
								} else {
									newprics = getValidQuantity(newprics, exchange_.filters[0].tickSize)
								}									
								var amountpup = (amount-percensx)*newprics	
								var amountscc = (amountpup-budgetsx).toFixed(4)
								if (amountscc > 0.0100){
									price = newprics;
								}
							}
							console.log(price)
							binance.sell(orders[2].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {															
								orderIdnew = response.orderId;							
							})
							while (true) {
								if (orderIdnew !== 0){
									break
								}
								await sleep(5);
							}
							if (orderIdnew === undefined){
								var cancelOrder = binance.cancelOrders(orders[1].market.replace('/', ''), (error, response, symbol) => {})		
								if (cancelOrder === undefined){
									const resulxxxx = await binance.balance();
									orderIdnew = 0;
									amount = parseFloat(resulxxxx[chain[2]].available)
									_exchangeInfo = exchangeInfo.symbols.find(el => el.symbol === orders[2].market.replace('/', ''));
									if (_exchangeInfo.filters[2].minQty === '1.00000000') {
										amount = Math.floor(amount)
									} else {
										amount = getValidQuantity(amount, _exchangeInfo.filters[2].minQty)
									}
									binance.sell(orders[2].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {															
										orderIdnew = response.orderId;							
									})									
									while (true) {
										if (orderIdnew !== 0){
											break
										}
										await sleep(5);
									}
								}
							}
							
							console.log('Start : ' + budgetsx.toFixed(8))
							break	
						}
						await sleep(5000);
						console.log('===========================================================================')
						loops = 0
					}
				}
			}
		}
		return ret;
	}

	checkProfit.BASE_USD_BUDGET = BUDGET;
	checkProfit.FEE = parseFloat(FEERate);
	return checkProfit;
}
