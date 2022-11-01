const Binance = require('node-binance-api');
const Exchange = require('./Exchange');
const Decimal = require('decimal.js')
const { MongoClient } = require('mongodb');
const url = 'mongodb://34.101.125.35/?directConnection=true';
const client = new MongoClient(url);

const dbName = 'ABT';
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
	
	await client.connect();
	console.log('Connected successfully to server');
	const db = client.db(dbName);
	const collection = db.collection('ABT_GG');
	
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
					var amountbest = (orders[2].amount).toFixed(8)
					var pricebest = (orders[2].price).toFixed(8);
					var percenb = amountbest*0.0011					
					var amountb = (amountbest-percenb)*pricebest
					let profitnew = amountb-parseFloat(BUDGET)	
					if (profitnew > 0.0050 && profitTable < 5 ) {
						loops = 1
						var orderIdnew = 0;	
						console.log(chain)					
						var ascOrder = percen.sort((a, b) => a > b ? 1 : -1);
						console.log('Profit : ' + profitnew.toFixed(4) + ' Fee : ' + fee.toFixed(4) + ' Amount : ' + percen[0] + "%")
						let failcheck = false;
						var budgets = BUDGET
						let waitone = undefined
						let waittwo = undefined
						var amountstart = 0
						let ErrorX = false;
						for (let i = 0; i < 3; i += 1) {
							var amount = (orders[i].amount).toFixed(8);
							var price = (orders[i].price).toFixed(8);
							let marketoldx = orders[i].market.split('/');					
							const resulbalnce = await binance.balance();
							if (i === 0){
								let _balances = parseFloat(resulbalnce['USDT'].available)
								if (parseFloat(_balances).toFixed(8) >= (parseFloat(budgets)-1)){
									amount = parseFloat(_balances)
									if (amount > budgets){
										amount = budgets
									}
									failcheck = true
									console.log("\t ->(FILLED - USDT)")
									i++;
									marketoldx = orders[i].market.split('/');
									price = (orders[i].price).toFixed(8);
								}					
							}
							
							if (i > 0 && failcheck === false) {															
								if (orders[i].side === 'sell') {
									amount = parseFloat(resulbalnce[marketoldx[0]].available)
								} else {
									amount = parseFloat(resulbalnce[marketoldx[1]].available) / price
								}
							} else {
								if (amount > budgets){
									amount = budgets
								}
								amount = (percen[0] / 100) * parseFloat(amount)
								amountstart = amount
							}
							if (failcheck == true){						
								amount = (percen[0]/100)*parseFloat(amount)	
								amountstart = amount
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
							
							/*if (i === 1){
								binance.bookTickers(orders[2].market.replace('/', ''), (error, ticker) => {									
									
									var amountux = amount*0.001
									var amountuy = amount - amountux
									var bookTickerss = (amountuy*parseFloat(ticker.bidPrice))								
									if (bookTickerss < parseFloat(amountstart)){
										i = 8
										waitone = 8
										console.log("\t ->(Price Low | " + ticker.bidPrice + " | " + bookTickerss.toFixed(4) + "/" + amountstart.toFixed(4) +")")
									} else {
										console.log("\t ->(Price Correct | " + ticker.bidPrice + " | " + bookTickerss.toFixed(4) + "/" + amountstart.toFixed(4) +")")
										waitone = 8
									}
								});							
								while (true) {
									if (waitone != undefined){
										break
									}
									await sleep(10);
								}
							}*/
							
							if (i < 5 ){
								if (i === 2){
									binance.bookTickers(orders[i].market.replace('/', ''), (error, ticker) => {									
										if ((amount*parseFloat(ticker.bidPrice)) > amountstart){
											price = ticker.bidPrice;
											console.log("\t ->(UPDATE - Price 1 | " + price + ")")
											waittwo = 8
										} else {
											if ((amount*parseFloat(ticker.askPrice)) > amountstart){
												price = ticker.askPrice;
												console.log("\t ->(UPDATE - Price 2 | " + price + ")")	
												waittwo = 8
											} else {
												waittwo = 8
											}
										}
									});
									
									while (true) {
										if (waittwo != undefined){
											break
										}
										await sleep(5);
									}
								}
			
								if (orders[i].side === 'buy') {
									waitOrder = orders[i].market.replace('/', '')
									binance.buy(orders[i].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {																
										orderIdnew = response.orderId;
										waitOrder = undefined
										
										const insertResult = await collection.insertOne(
											{
												orderId: response.orderId,
												symbols: orders[i].market.replace('/', ''),
												qty: parseFloat(amount),
												price: parseFloat(price),
												side: 'buy',
												status: '',
												ref: Ref,

											});
											
											
									})
								} else {
									waitOrder = orders[i].market.replace('/', '')
									binance.sell(orders[i].market.replace('/', ''), parseFloat(amount), parseFloat(price), { type: 'LIMIT' }, (error, response) => {
										orderIdnew = response.orderId;
										waitOrder = undefined
										
										const insertResult = await collection.insertOne(
											{
												orderId: response.orderId,
												symbols: orders[i].market.replace('/', ''),
												qty: parseFloat(amount),
												price: parseFloat(price),
												side: 'sell',
												status: '',
												ref: Ref,

											});
									})
								}					

								if (waitOrder !== undefined) {
									while (true) {
										if (waitOrder === undefined){
											break
										}
										await sleep(5);
									}
								}

								if (orderIdnew != 0 && i < 5){									
									let ckStatus = false
									let PARTIALLY = false
									let cancelOrderC = false
									var loopcoder = 0
									var marketold = orders[i].market.replace('/', '');
									console.log("\t ->(OrderID | " + orderIdnew + " | " + marketold + " | " + price + ")")								
									while (true) {
										var orderStatus = 0;
										binance.allOrders(marketold, (error, orders, symbol) => {																	
											try {										
												orderStatus = orders.find(o => o.orderId === parseFloat(orderIdnew));
												if (orderStatus !== undefined) {
													if (orderStatus.status === 'FILLED') {
														ckStatus = true
													}
													if (orderStatus.status === 'CANCELED') {
														i = 8
														ckStatus = true
													}
													if (i < 2 && orderStatus.status === 'NEW') {
														cancelOrderC = true
													}
													if (orderStatus.status === 'PARTIALLY_FILLED') {
														PARTIALLY = true
													}		

													const updateResult = await collection.updateOne({ orderId: orderIdnew }, { $set: { status: orderStatus.status } });

													
												}
											} catch (er) {
											}								
										})	
										
										while (true) {
											if (orderStatus !== 0){
												break
											}
											await sleep(5);
										}
										
										if (PARTIALLY){
											await sleep(1000);
										}	

										if (cancelOrderC && loopcoder > 5){
											var cancelOrder = binance.cancelOrders(marketold, (error, response, symbol) => {
												if (response.status === 'CANCELED') {
													i = 8
													ckStatus = true
												}
											})
										}
										
										if(ckStatus) {
											break
										} else {										
											if (i === 2){
												ErrorX = true
												break
											}
											if (orderIdnew === undefined){
												break
											}
											if (loopcoder > 6){
												await sleep(500);
											} else {
												loopcoder++;
												await sleep(50);
											}											
										}									
									}
								}		
							}																										
						}
						if (ErrorX){
							console.log('------------------------------------------------------------')
							console.log('Check Balances!')
							let USDTcheck = false;
							const resulbalnce = await binance.balance();
							let _balancesUSDT = parseFloat(resulbalnce['USDT'].available)
							let _balancesBUSD = parseFloat(resulbalnce['BUSD'].available)
							let _balances = _balancesUSDT+_balancesBUSD
							console.log('Balances : ' + _balances.toFixed(8))
							var betold = 0
							if (parseFloat(_balancesUSDT).toFixed(8) >= (parseFloat(BUDGET)-1)){
								USDTcheck = false
								console.log('FILLED')
							} else {
								USDTcheck = true
								betold = parseFloat(BUDGET) - parseFloat(_balancesUSDT).toFixed(8)
							}					
							if (betold < 11){
								betold = 11
							}
							if (USDTcheck){
								console.log('BUY USDT!')
								binance.marketSell('BUSDUSDT', Math.floor(betold)+1);
							}
						}	
						console.log('============================================================')
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
