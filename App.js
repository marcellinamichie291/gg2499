const Binance = require('node-binance-api');
const BuildPairs = require('./lib/Pairs.js');
const BuildProcess = require('./lib/Process.js');

const binance = new Binance().options({
	APIKEY: 'PuancJFxD9kZy90iOZOB24FlSzHxXlJLweikBfVQXVm22QUMDvpN8Bl6W5xzrjop',
	APISECRET: 'hj7XYKSwfVgREKKBZbd5X7JvtJI9XgVX1z22YIhSdehzl7yzw1LXrioDLJmX4MBt',
    'family': 4,
})

const listAskBet = {}
let listPairUpdate = []

function skipRealCurrency(Symbol) {
	let symbolList = [
		'AED', 'AFN', 'ALL', 'AMD', 'ARS', 'AUD', 
		'AZN', 'BAM', 'BDT', 'BGN', 'BHD', 'BIF', 
		'BND', 'BOB', 'BRL', 'BWP', 'BYN', 'BZD', 
		'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 
		'CRC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 
		'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'EUR', 
		'GBP', 'GEL', 'GHS', 'GNF', 'GTQ', 'HKD', 
		'HNL', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 
		'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 
		'KES', 'KHR', 'KMF', 'KRW', 'KWD', 'KZT', 
		'LBP', 'LKR', 'LTL', 'LVL', 'LYD', 'MAD', 
		'MDL', 'MGA', 'MKD', 'MMK', 'MOP', 'MUR', 
		'MXN', 'MYR', 'TRY', 'RUB', 'STMX', 'UAH',
	]
	for(i = 0; i < symbolList.length; i++) {
		if(Symbol.includes(symbolList[i])) {
			return true;
		}
	}
	return false;
}

function bookTickers() {
	binance.websockets.bookTickers((e) => {
		if(skipRealCurrency(e.symbol)) return
		
		if(listAskBet[e.symbol] !== undefined) {
			if(listAskBet[e.symbol].updateId != e.updateId) {
				if(!listPairUpdate.includes(e.symbol)) {
					listPairUpdate.push(e.symbol)
				}
			}
		}
		
		listAskBet[e.symbol] = {
			lastUpdate: e.updateId,
			bidPrice: e.bestBid,
			bidQty: e.bestBidQty,
			askPrice: e.bestAsk,
			askQty: e.bestAskQty
		}
	})
}

// WebSocket
bookTickers()

// Main
const arbitrageBot = async() => {
	// onMount
	const { hashMarket, pairs: allPairs } = await BuildPairs()
	
	const checkProcess = await BuildProcess()
	
	// Tick
	onTick = async function onTick() {
		const updatePair = listPairUpdate
		const marketList = listAskBet
		
		listPairUpdate = []
		
		let pairsToTest = updatePair.map( pair => hashMarket[ pair ] ).flat()
		pairsToTest = [ ...new Set( pairsToTest ) ].map( id => allPairs[ id ] ).filter( e => e )

		if (!pairsToTest.length) {
			setTimeout(onTick, 50)
			return
		}
		
		let Result
		try {
			Result = await checkProcess( pairsToTest, marketList )
		} catch ( Error ) {
			console.error( Error )
		}
		
		const ListDelete = Result.filter( e => e.profit.gt( 1 ) )
		if ( ListDelete.length ) {
			for (let i = 0; i < ListDelete.length; i++) {
				let dataSymbol = ListDelete[i]
				for ( let k = 0; k < ( dataSymbol.orders.length ); k++ ) {
					let symbolDelete = dataSymbol.orders[k].market.replace('/', '')
					delete listAskBet[symbolDelete]
				}
			}
		}
		
		setTimeout(onTick, 5)
	}
	onTick()
}

arbitrageBot()
