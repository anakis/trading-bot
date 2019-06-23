const _ = require('lodash')

module.exports = async app => {
  const startExchange = async () => {
    const { API_KEY: apiKey, API_SECRET: secret } = app.config.constants
    const exchange = app.libs.bitfinex({ apiKey, secret })

    await exchange.loadMarket()

    return exchange
  }

  const createPairs = exchange => {
    const { BASES: bases, QUOTE: quote } = app.config.constants

    return exchange.getFormattedPairs({ bases: Array.isArray(bases) ? bases : [bases], quote })
  }

  const getTimeOneDayAgo = () => Date.now() - (Date.now() % 60000) - 1000 * 60 * 60 * 24 // One day ago

  const getPrices = async (start = getTimeOneDayAgo()) => {
    try {
      const { TIMEFRAME: timeframe } = app.config.constants

      const { exchange, pairs } = this

      const timestamp = start

      const prices = await exchange.getConsolidatedPrices({
        pairs,
        timeframe,
        timestamp,
      })

      return prices
    } catch (error) {
      throw error
    }
  }

  const getSanitizedLivePrice = candle => _.mapValues(candle, price => {
    const ohlcv = [price.o, price.h, price.l, price.c, 0]

    return {
      ohlcv,
      timestamp: new Date().setSeconds(0, 0),
    }
  })

  const getLivePrices = () => getSanitizedLivePrice(this.exchange.getLivePrices())

  const loadBalance = async () => {
    const balance = await this.exchange.loadAccountBalance()
    return balance.free
  }

  const getPairs = () => this.pairs

  const getPair = key => this.pairs.find(({ symbol }) => symbol === key)

  const createOrder = async ({
    symbol, side, amount, price,
  }) => this.exchange.createOrder({
    symbol,
    side,
    amount,
    price,
  })

  const init = async () => {
    const exchange = await startExchange()

    const pairs = createPairs(exchange)

    await exchange.watchLivePrices(pairs)

    this.exchange = exchange

    this.pairs = pairs

    return this
  }

  await init()

  return {
    getPrices,
    getPairs,
    getPair,
    loadBalance,
    getLivePrices,
    createOrder,
  }
}
