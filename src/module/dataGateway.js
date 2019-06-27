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

  const hasInvalidNumbers = list => list.includes(NaN) || list.includes(undefined)

  const getLivePrices = () => {
    const livePrices = getSanitizedLivePrice(this.exchange.getLivePrices())
    this.prices = _.mapValues(this.prices, (price, index) => {
      // if got undefined from livePrices, don't update prices list
      if (!hasInvalidNumbers(livePrices[index].ohlcv)) {
        return [...price, livePrices[index]]
      }
      return [...price]
    })
    return this.prices
  }

  const loadBalance = async () => {
    const balance = await this.exchange.loadAccountBalance()
    return balance.free
  }

  const getPairs = () => this.pairs

  const getPair = key => this.pairs.find(({ symbol }) => symbol === key)

  const createOrder = async ({
    symbol, side, amount, price,
  }) => this.exchange.createLimitOrder({
    symbol,
    side,
    amount,
    price,
  })

  const createStopLoss = async ({
    symbol, amount, side, price,
  }) => this.exchange.createStopOrder({
    symbol,
    side: side === 'sell' ? 'buy' : 'sell',
    amount,
    price,
  })

  const getOpenOrders = async () => {
    const orders = await this.exchange.getOpenOrders()
    return _.keyBy(orders, 'symbol')
  }

  const removeOrder = async id => {
    try {
      return this.exchange.removeOrder(id)
    } catch (e) {
      return removeOrder(id)
    }
  }

  const init = async () => {
    const exchange = await startExchange()

    const pairs = createPairs(exchange)

    await exchange.watchLivePrices(pairs)

    this.exchange = exchange

    this.pairs = pairs

    this.prices = await getPrices()

    return this
  }

  await init()

  return {
    getPairs,
    getPair,
    loadBalance,
    getLivePrices,
    createOrder,
    createStopLoss,
    getOpenOrders,
    removeOrder,
  }
}
