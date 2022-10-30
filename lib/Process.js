const Binance = require('node-binance-api');
const Exchange = require('./Exchange');
const Decimal = require('decimal.js')
var loops = 0
const BUDGET = "15"
const FEERate = "0.00034"

module.exports = async function (BASE_USD_BUDGET = BUDGET, FEE = FEERate) {
	const tickers = await Exchange.getTickersData();
	const marketsData = await Exchange.getMarketsData();
	const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))
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
		const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
					if (profitTable > 0.0010) {
						loops = 1
						var orderIdnew = 0;	
						console.log(chain)
						console.log('Profit : ' + profitTable + '%' + ' Fee : ' + fee.toFixed(4))
						console.log(percen)
						var ascOrder = percen.sort((a, b) => a > b ? 1 : -1);
						let failcheck = false;
						var budgets = BUDGET
						for (let i = 0; i < 3; i += 1) {
							var amount = (orders[i].amount).toFixed(8);
							var price = (orders[i].price).toFixed(8);
							let marketoldx = orders[i].market.split('/');					
							const resulbalnce = await binance.balance();
							if (i === 0){
								let _balances = parseFloat(resulbalnce['USDT'].available)
								if (parseFloat(_balances).toFixed(8) >= (parseFloat(budgets)-1)){
									amount = parseFloat(_balances)
									failcheck = true
									console.log('FILLED - USDT')
									i++;
									marketoldx = orders[i].market.split('/');
									price = (orders[i].price).toFixed(8);
								}					
							}
							
							if (i > 0) {															
								if (orders[i].side === 'sell') {
									amount = parseFloat(resulbalnce[marketoldx[0]].available)
								} else {
									amount = parseFloat(resulbalnce[marketoldx[1]].available) / price
								}
							} else {
								amount = (percen[0] / 100) * parseFloat(amount)
							}
							if (failcheck == true){						
								amount = (percen[0]/100)*parseFloat(amount)							
								amount = amount/price
								failcheck = false;
							}			
							amount = parseFloat(amount)
							
							var _exchangeInfo = exchangeInfo.symbols.find(el => el.symbol === orders[i].market.replace('/', ''));
							if (_exchangeInfo.filters[2].minQty === '1.00000000') {
								amount = Math.floor(amount)
							} else {
								amount = getValidQuantity(amount, _exchangeInfo.filters[2].minQty)
							}
														
							if (orders[i].side === 'buy') {
								waitOrder = orders[i].market.replace('/', '')
								binance.buy(orders[i].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {																
									orderIdnew = response.orderId;
									waitOrder = undefined
								})
							} else {
								waitOrder = orders[i].market.replace('/', '')
								binance.sell(orders[i].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {
									orderIdnew = response.orderId;
									waitOrder = undefined
								})
							}					
							
							if (waitOrder !== undefined) {
								while (true) {
									if (waitOrder === undefined){
										break
									}
									await sleep(50);
								}
							}
							
							if (orderIdnew != 0){
								let ckStatus = false
								var marketold = orders[i].market.replace('/', '');
								while (true) {
									binance.allOrders(marketold, (error, orders, symbol) => {																	
										try {
											var orderStatus = orders.find(o => o.orderId === parseFloat(orderIdnew));
											if (orderStatus !== undefined) {
												if (orderStatus.status === 'FILLED') {
													ckStatus = true
												}
												if (orderStatus.status === 'CANCELED') {
													i = 8
													ckStatus = true
												}
												if (i === 1 && orderStatus.status === 'NEW') {
													i = 8
													ckStatus = true
												}
											}
										} catch (er) {
										}								
									})
									if(ckStatus) {
										console.log("\t ->(" + orderIdnew + ") Filled (" + marketold + ")" + " Amount " + parseFloat(amount).toFixed(8) + "@" + parseFloat(price).toFixed(8))
										break
									} else {
										if (i === 2){
											await sleep(500);
										}
										await sleep(10);
									}							
								}
							}																		
						}
						console.log('=====================================================')
						loops = 0
					}
				}
			}
		}
		return ret;
	}

	checkProfit.BASE_USD_BUDGET = BUDGET;
	checkProfit.FEE = parseFloat(FEERate);


	/*binance.websockets.trades(['BNBBTC', 'ETHBTC'], (trades) => {
	  let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
	  console.info(symbol+" trade update. price: "+price+", quantity: "+quantity+", maker: "+maker);
	});*/




	return checkProfit;
}
