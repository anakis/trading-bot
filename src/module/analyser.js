const indicators = require('technicalindicators')

const _ = require('lodash')

module.exports = app => {
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
      RSI_PERIOD,
      STOCHASTIC_PERIOD,
      STOCHASTIC_SIGNAL_PERIOD,
      ATR_PERIOD,
    } = app.config.constants

    const [prevRSI, currentRSI] = indicators.RSI.calculate({
      period: RSI_PERIOD,
      values: close,
    }).splice(-2, 2)

    const [prevStoch, currentStoch] = indicators.Stochastic.calculate({
      period: STOCHASTIC_PERIOD,
      signalPeriod: STOCHASTIC_SIGNAL_PERIOD,
      close,
      high,
      low,
    }).splice(-2, 2)

    const atr = indicators.ATR.calculate({
      period: ATR_PERIOD,
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

  const getAnalyse = prices => {
    const analyses = _.mapValues(prices, price => ({
      analyse: analyse(price),
      price: price[price.length - 1].ohlcv[3],
    }))
    return _.pickBy(analyses, ({ analyse: { action } }) => action !== 'WAIT')
  }

  return {
    getAnalyse,
  }
}
