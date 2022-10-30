const ccxt = require('ccxt')

let binanceApi

async function getMarketsData() {
    binanceApi = binanceApi || new ccxt.binance()
	let marketsData = await binanceApi.loadMarkets()
    return marketsData
}

async function getTickersData() {
    binanceApi = binanceApi || new ccxt.binance()
	let tickersData = await binanceApi.fetchTickers()
    return tickersData;
}

module.exports = { getMarketsData, getTickersData }