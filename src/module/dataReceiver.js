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

  const _loadBalance = async () => this.exchange.loadAccountBalance()

  const loadQuoteBalances = async () => {
    const { QUOTE: quote } = app.config.constants
    const funds = await _loadBalance()
    return funds[quote]
  }

  const loadPositionBalance = async () => {
    const { BASES: bases } = app.config.constants
    const funds = await _loadBalance()
    return _.pick(funds, bases)
  }

  const getPairs = () => this.pairs

  const getPair = key => this.pairs.find(({ symbol }) => symbol === key)

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
    loadQuoteBalances,
    loadPositionBalance,
    getLivePrices,
  }
}
