require('dotenv').config()

const getBases = () => process.env.BASE_ARRAY.split(',')

const getQuote = () => process.env.QUOTE_COIN

const getTimeFrame = () => process.env.TIMEFRAME

const getRSIperiod = () => parseInt(process.env.RSI_PERIOD, 10)

const getStochasticPeriod = () => parseInt(process.env.STOCHASTIC_PERIOD, 10)

const getStochasticSignalPeriod = () => parseInt(process.env.STOCHASTIC_SIGNAL_PERIOD, 10)

const getATRperiod = () => parseInt(process.env.ATR_PERIOD, 10)

module.exports = () => {
  const bases = getBases()
  const quote = getQuote()
  const timeframe = getTimeFrame()
  const rsiPeriod = getRSIperiod()
  const stochasticPeriod = getStochasticPeriod()
  const stochasticSignalPeriod = getStochasticSignalPeriod()
  const atrPeriod = getATRperiod()

  return {
    bases,
    quote,
    timeframe,
    rsiPeriod,
    stochasticPeriod,
    stochasticSignalPeriod,
    atrPeriod,
  }
}
