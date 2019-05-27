const indicators = require('technicalindicators')

const _ = require('lodash')

module.exports = async app => {
  const hasInvalidNumbers = list => list.includes(NaN) || list.includes(undefined)

  const intersect = (x, y) => {
    const [firstX, secondX] = x
    const [firstY, secondY] = y

    const det = secondY - firstY - (secondX - firstX)
    if (det === 0) return false

    const lambda = (secondY - firstY - (secondY - firstX)) / det
    const gamma = (firstX - secondX + (secondY - firstX)) / det

    return lambda > 0 && lambda < 1 && (gamma > 0 && gamma < 1)
  }

  const createIndicators = prices => {
    const [, high, low, close] = [0, 1, 2, 3, 4].map(i => prices.map(c => c.ohlcv[i]))

    const {
      rsiPeriod, stochasticPeriod, stochasticSignalPeriod, atrPeriod,
    } = app.config.constants

    const [prevRSI, currentRSI] = indicators.RSI.calculate({
      period: rsiPeriod,
      values: close,
    }).splice(-2, 2)

    const [prevStoch, currentStoch] = indicators.Stochastic.calculate({
      period: stochasticPeriod,
      signalPeriod: stochasticSignalPeriod,
      close,
      high,
      low,
    }).splice(-2, 2)

    const atr = indicators.ATR.calculate({
      period: atrPeriod,
      close,
      high,
      low,
    }).pop()

    return {
      rsi: { prevRSI, currentRSI },
      stoch: { prevStoch, currentStoch },
      atr,
    }
  }

  const analyse = prices => {
    const {
      rsi: { prevRSI, currentRSI },
      stoch: { prevStoch, currentStoch },
      atr,
    } = createIndicators(prices)

    if (prevStoch && currentStoch) {
      const toTestInvalidNumbers = [
        prevStoch.k,
        currentStoch.k,
        prevStoch.d,
        currentStoch.d,
        prevRSI,
        currentRSI,
      ]
      if (!hasInvalidNumbers(toTestInvalidNumbers)) {
        if (intersect([prevStoch.k, currentStoch.k], [prevStoch.d, currentStoch.d])) {
          if (currentStoch.k < 20 && prevRSI <= 30 && currentRSI > 30) return { action: 'LONG', atr }
          if (currentStoch.k > 80 && prevRSI > 70 && currentRSI <= 70) return { action: 'SHORT', atr }
        }
      }
    }
    return { action: 'WAIT', atr }
  }

  const getAnalyse = () => {
    const livePrices = this.getLivePrices()
    this.prices = _.mapValues(this.prices, (price, index) => {
      // if got undefined from livePrices, don't update prices list
      if (!hasInvalidNumbers(livePrices[index].ohlcv)) {
        return [...price, livePrices[index]]
      }
      return [...price]
    })
    const analyses = _.mapValues(this.prices, price => ({
      analyse: analyse(price),
      price: price[price.length - 1].ohlcv[3],
    }))
    return analyses
  }

  const init = async () => {
    const { getPrices, getLivePrices } = await app.module.dataReceiver
    this.prices = await getPrices()
    this.getLivePrices = getLivePrices
    console.log('Starting analyse...')

    return this
  }

  await init()

  return {
    getAnalyse,
  }
}
