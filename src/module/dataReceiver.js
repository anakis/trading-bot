const _ = require('lodash')

module.exports = async app => {
  const startExchange = async () => {
    const exchange = app.libs.bitfinex

    await exchange.loadMarket()

    return exchange
  }

  const createPairs = exchange => {
    const { BASES: bases, QUOTE: quote } = app.config.constants

    return exchange.getFormattedPairs({ bases, quote })
  }

  const getTimestamp = () => Date.now() - (Date.now() % 60000) - 1000 * 60 * 60 * 24 // One day ago

  const getPrices = async () => {
    try {
      const { TIMEFRAME: timeframe } = app.config.constants

      const { exchange, pairs } = this

      const timestamp = getTimestamp()

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
    getLivePrices,
  }
}
