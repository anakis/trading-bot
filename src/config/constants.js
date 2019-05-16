require('dotenv').config()

const getBases = () => process.env.BASE_ARRAY.split(',')

const getQuote = () => process.env.QUOTE_COIN

const getTimeFrame = () => process.env.TIMEFRAME

module.exports = () => {
  const bases = getBases()
  const quote = getQuote()
  const timeframe = getTimeFrame()

  return {
    bases,
    quote,
    timeframe,
  }
}
