require('dotenv').config()

const bitfinex = require('./dataReceiver/bitfinex.driver')

const run = async () => {
  const startExchange = async () => {
    const exchange = bitfinex()

    await exchange.loadMarket()

    return exchange
  }

  const MODE = {
    TREND_UP: 'TREND_UP',
    BASE_ARRAY: 'BASE_ARRAY',
  }

  const getBases = () => process.env.BASE_ARRAY.split(',')

  const getQuote = () => process.env.QUOTE_COIN

  const getTimeFrame = () => process.env.TIMEFRAME

  const getStarterTimestamp = () => Date.now() - (Date.now() % 60000) - 1000 * 60 * 60 * 24 // One day ago

  const createPairs = (exchange) => {
    const bases = getBases()

    const quote = getQuote()

    return exchange.getFormattedPairs({ bases, quote })
  }

  async function runBaseArrayMode(exchange) {
    const pairs = createPairs(exchange)

    const timeFrame = getTimeFrame()

    const timestamp = getStarterTimestamp(timeFrame)

    const prices = await exchange.getConsolidatedPrices({
      pairs,
      timeFrame,
      timestamp,
    })

    console.log(prices)
  }

  const getMode = () => process.env.MODE

  const handleMode = (exchange) => {
    const mode = getMode()

    switch (mode) {
      case MODE.TREND_UP:
        // runTrendUpMode(exchange)
        break
      case MODE.BASE_ARRAY:
      default:
        runBaseArrayMode(exchange)
        break
    }
  }

  try {
    const exchange = await startExchange()

    handleMode(exchange)
  } catch (error) {
    console.log(error.message)
  }
}

run()
