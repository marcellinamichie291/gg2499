import Decimal from 'decimal.js';
import { getMarketsData, getTickersData } from './exchange';
import Binance from 'binance-api-react-native'

const BUDGET = "15"

export default async function createProfitFunc(BASE_USD_BUDGET = BUDGET, FEE = "0") {
	
	const tickers = await getTickersData();
	const marketsData = await getMarketsData();
	const client = Binance({
	  apiKey: 'PuancJFxD9kZy90iOZOB24FlSzHxXlJLweikBfVQXVm22QUMDvpN8Bl6W5xzrjop',
	  apiSecret: 'hj7XYKSwfVgREKKBZbd5X7JvtJI9XgVX1z22YIhSdehzl7yzw1LXrioDLJmX4MBt',
	})

	const exchangeInfo = await client.exchangeInfo();
	var loops = 0
	var parcenbet = 60
	
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
    const stables = 'USDT,BUSD'.split(',');
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
      } if (marketsData[stablep2] && markets[stablep2]) {
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
      } if (marketsData[stablep2] && tickers[stablep2]) {
        symbol = stablep2;
        return (new Decimal(BASE_USD_BUDGET))
          .mul(tickers[symbol].bid)
          .toDecimalPlaces(marketsData[symbol].precision.quote, Decimal.ROUND_DOWN);
      }
    }

    throw new Error(`no budget price for ${coin}`);
  }

	var profitall = 0;

  async function checkProfit(pairsToTest, markets) {
    const ret = [];
    const winners = [];
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
	let oldPair = null;

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
        const p12 = [chain[i], chain[i + 1]].join('/');
        const p21 = [chain[i + 1], chain[i]].join('/');
        log.push(budget + chain[i]);	
        if (markets[p12] && marketsData[p12]) {
          if (!markets[p12].bidPrice) {
            fail = true;
            break;
          }	  
          const bidPrice = Decimal(markets[p12].bidPrice)
            .toDecimalPlaces(marketsData[p12].precision.price, Decimal.ROUND_DOWN);
          budget = budget.toDecimalPlaces(marketsData[p12].precision.amount, Decimal.ROUND_DOWN);		  
          
		  var parc = 0;		  
		  if (parseFloat(markets[p12].bidQty) >= budget.toFixed(8)){
			parc = 100;
		  } else {
			var valuepercen = (parseFloat(markets[p12].bidQty)*100)/budget.toFixed(8);
			parc = Math.floor(valuepercen);
		  }	  
		  if (parc < parcenbet) {
            fail = true;
            break;
          }
		  
		  percen.push(parc);
		  
		  orders.push({
            market: p12,
            side: 'sell',
            amount: budget,
            price: bidPrice,
            link: `https://www.binance.com/en/trade/${p12.replace('/', '_')}?ref=OJN3QQMJ`,
            total: budget.mul(bidPrice).toDecimalPlaces(marketsData[p12].precision.quote, Decimal.ROUND_DOWN),
          });

          budget = budget.mul(bidPrice);

          log.push(JSON.stringify({ n: p12, p: markets[p12] }));
        } else if (markets[p21] && marketsData[p21]) {
          if (!markets[p21].askPrice) {
            fail = true;
            break;
          }
          const askPrice = Decimal(markets[p21].askPrice).toDecimalPlaces(marketsData[p21].precision.price, Decimal.ROUND_DOWN);
          const prevBudget = budget;
          budget = budget.div(askPrice)
            .toDecimalPlaces(marketsData[p21].precision.amount, Decimal.ROUND_DOWN);
		  var parc = 0;		  
		  if (parseFloat(markets[p21].askQty) >= budget.toFixed(8)){
			parc = 100;
		  } else {
			var valuepercen = (parseFloat(markets[p21].askQty)*100)/budget.toFixed(8);
			parc = Math.floor(valuepercen);
		  }		  
		  if (parc < parcenbet) {
            fail = true;
            break;
          }
		  
		  percen.push(parc);
		  
          orders.push({
            market: p21,
            side: 'buy',
            amount: budget,
            price: askPrice,
            link: `https://www.binance.com/en/trade/${p21.replace('/', '_')}`,
            total: prevBudget.toDecimalPlaces(marketsData[p21].precision.quote, Decimal.ROUND_DOWN),
          });

        } else {
          fail = true;
          break;
        }

      }
      if (!fail) {
        const fee = Decimal(checkProfit.FEE).mul(3);
        const profit = budget.div(initialBudget).sub(fee);
		let profitTable = profit.sub( 1 ).mul( 100 ).toFixed( 4 )	
		
		if (loops === 0){
			if(profitTable > 0.0010){
				loops = 1
				console.log(chain)
				console.log('Profit : ' + profitTable + '%')
				console.log(percen)
				var ascOrder = percen.sort((a, b) => a > b ? 1 : -1);
				let failcheck = false;
				let ErrorX = false;
				var budgets = BUDGET
				var amountupdate = 0;
				for (let i = 0; i < 3; i += 1) {										
					var amount = (orders[i].amount).toFixed(8);
					var price = (orders[i].price).toFixed(8);				
					let marketoldx = orders[i].market.split('/');
					var resulbalnce = await client.accountInfo()
					if (i === 0){
						let _balances = resulbalnce.balances.find(el => el.asset === 'USDT');
						if (parseFloat(_balances["free"]).toFixed(8) >= (parseFloat(budgets)-1)){
							amount = parseFloat(_balances["free"])
							failcheck = true
							console.log('FILLED - USDT')
							i++;
							marketoldx = orders[i].market.split('/');
							price = (orders[i].price).toFixed(8);
						}					
					}
						
					if(i > 0 && !failcheck) {														
						if (orders[i].side === 'sell'){
							let _balances = resulbalnce.balances.find(el => el.asset === marketoldx[0]);
							amount = parseFloat(_balances["free"])	
						} else {
							let _balances = resulbalnce.balances.find(el => el.asset === marketoldx[1]);
							amount = parseFloat(_balances["free"])/price
						}								
					} else {
						amount = (percen[0]/100)*parseFloat(amount)
					}
					if (failcheck == true){						
						amount = (percen[0]/100)*parseFloat(amount)
						
						amount = amount/price
						failcheck = false;
					}
					amount = parseFloat(amount)
					
					var _exchangeInfo = exchangeInfo.symbols.find(el => el.symbol === orders[i].market.replace('/', ''));
					if (_exchangeInfo.filters[2].minQty === '1.00000000'){
						amount = Math.floor(amount)
					} else {	
						amount = getValidQuantity(amount,_exchangeInfo.filters[2].minQty)	
					}
					
					if (i === 1){					
						var resultccc = await client.book({ symbol: orders[2].market.replace('/', '') });
						var winnersx = (orders[2].amount).toFixed(8)*parseFloat(resultccc.bids[0].price)
						var winnersv = (orders[2].amount).toFixed(8)*parseFloat(orders[2].price).toFixed(8)
						if (winnersx > parseFloat(BUDGET)) {
							console.log(winnersx + " | " + resultccc.bids[0].price + " | " + (orders[i].amount).toFixed(8))
							console.log(winnersv + " | " + (orders[2].price).toFixed(8) + " | " + (orders[i].amount).toFixed(8))
							amountupdate = resultccc.bids[0].price;
						} else {
							console.log(winnersx + " | " + resultccc.bids[0].price + " | " + (orders[i].amount).toFixed(8))
							console.log(winnersv + " | " + (orders[2].price).toFixed(8) + " | " + (orders[i].amount).toFixed(8))
							ErrorX = true
							i = 8;
						}
					}
					
					if (i === 2){
						price = amountupdate
					}
					
					if (i < 5){
						try {										
							var resulx = await client.order({
								symbol: orders[i].market.replace('/', ''),
								side: orders[i].side,
								quantity: amount,
								price: price,
							})
							
							var loopnew = 0;
							while (true) {
								var resultOrder = await client.getOrder({
									symbol: orders[i].market.replace('/', ''),
									orderId: resulx.orderId,
								})			
								console.log(resultOrder.status)	
								if(resultOrder.status === 'FILLED') {	
									break								
								} else {									
									if(resultOrder.status === 'NEW') {	
										if (loopnew > 150 && i < 2){
											var cancelOrderS = await client.cancelOrder({
												symbol: orders[i].market.replace('/', ''),
												orderId: resulx.orderId,
											})
											i = 8
											ErrorX = true
											break
										}									
										loopnew++;
									}
									
									if (resultOrder.status === 'CANCELED') {	
										i = 8
										break							
									} else {
										//await sleep(100);
									}
								}
							}
						} catch (er) {
							console.log('Error!!!')
							ErrorX = true
							i = 8
						}
					}																		
				}			
				if (!ErrorX){
					console.log('----------------------------------')
					console.log('BUY USDT!')	
					let USDTcheck = false;
					var resulbalnce = await client.accountInfo()
					let _balances = resulbalnce.balances.find(el => el.asset === 'USDT');
					let _balancesBUSD = resulbalnce.balances.find(el => el.asset === 'BUSD');
					console.log('Balances BUSD : ' + _balancesBUSD["free"])
					var betold = 0
					if (parseFloat(_balances["free"]).toFixed(8) >= (parseFloat(BUDGET)-1)){
						USDTcheck = false
						console.log('FILLED')
					} else {
						USDTcheck = true
						betold = parseFloat(BUDGET) - parseFloat(_balances["free"]).toFixed(8)
					}
					
					if (betold < 11){
						betold = 11
					}
					if (USDTcheck){
						try {
							var resulx = await client.order({
								symbol: 'BUSDUSDT',
								side: 'sell',
								quantity: Math.floor(betold)+1,
								price: (orders[0].price).toFixed(8),
							})
											
							while (true) {
								var resultOrder = await client.getOrder({
									symbol: 'BUSDUSDT',
									orderId: resulx.orderId,
								})			
								console.log(resultOrder.status)	
								if(resultOrder.status === 'FILLED') {	
									break								
								} else {
									if(resultOrder.status === 'CANCELED') {	
										break							
									}
									await sleep(55);
								}						
							}
						} catch (er) {
							console.log('Error!!!')
						}		
					}
				}					
				console.log('==================================')
				loops = 0	
				/*ret.push({
                    chain,
                    profit,
                    orders,
                });
				
				var result_order = await client.order({
                  symbol: orders[i].market.replace('/', ''),
                  side: orders[i].side,
                  quantity: _amount,
                  type : 'MARKET'
                });*/
			}
		}
      }
    }
    return ret;
  }
  checkProfit.BASE_USD_BUDGET = BUDGET;
  checkProfit.FEE = 0;
  return checkProfit;
}
