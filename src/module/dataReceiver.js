
module.exports = async app => {
  const startExchange = async () => {
    const exchange = app.libs.bitfinex

    await exchange.loadMarket()

    return exchange
  }

  const createPairs = exchange => {
    const { bases, quote } = app.config.constants

    return exchange.getFormattedPairs({ bases, quote })
  }

  const getTimestamp = () => Date.now() - (Date.now() % 60000) - 1000 * 60 * 60 * 24 // One day ago

  const getPrices = async () => {
    try {
      const { timeframe } = app.config.constants

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

  const getLivePrices = () => this.exchange.getLivePrices()

  const init = async () => {
    const { timeframe } = app.config.constants

    const exchange = await startExchange()

    const pairs = createPairs(exchange)

    await exchange.watchLivePrices(pairs, timeframe)

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
