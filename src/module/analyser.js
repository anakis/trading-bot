const indicators = require('technicalindicators')

const _ = require('lodash')

module.exports = async app => {
  const hasInvalidNumbers = (...list) => list.includes(NaN) || list.includes(undefined)

  const intersect = (x, y) => {
    const [firstX, secondX] = x
    const [firstY, secondY] = y

    const det = (secondY - firstY) - (secondX - firstX)
    if (det === 0) return false

    const lambda = (secondY - firstY - (secondY - firstX)) / det
    const gamma = (firstX - secondX + (secondY - firstX)) / det

    return lambda > 0 && lambda < 1 && (gamma > 0 && gamma < 1)
  }

  const crossover = (x, y) => {
    let [firstX, secondX] = x
    let [firstY, secondY] = y

    secondX = secondX === undefined ? firstX : secondX

    secondY = secondY === undefined ? firstY : secondY

    return firstX < firstY && secondX > secondY
  }

  const crossunder = (x, y) => {
    let [firstX, secondX] = x
    let [firstY, secondY] = y

    secondX = secondX === undefined ? firstX : secondX

    secondY = secondY === undefined ? firstY : secondY

    return firstX > firstY && secondX < secondY
  }

  const createIndicators = prices => {
    // o,h,l,c,v
    // 0,1,2,3,4
    const [open, high, low, close, volume] = [0, 1, 2, 3, 4].map(i => prices.map(c => c.ohlcv[i]))

    const { rsiPeriod, stochasticPeriod, stochasticSignalPeriod } = app.config.constants

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

    return { rsi: { prevRSI, currentRSI }, stoch: { prevStoch, currentStoch } }
  }

  const analyse = prices => {
    const {
      rsi: { prevRSI, currentRSI },
      stoch: { prevStoch, currentStoch },
    } = createIndicators(prices)

    if (prevStoch && currentStoch) {
      if (
        !hasInvalidNumbers(
          prevStoch.k,
          currentStoch.k,
          prevStoch.d,
          currentStoch.d,
          prevRSI,
          currentRSI,
        )
      ) {
        // intersect([10, 20], [22, 9])
        if (intersect([prevStoch.k, currentStoch.k], [prevStoch.d, currentStoch.d])) {
          if (
            crossover([prevStoch.k, currentStoch.k], [prevStoch.d, currentStoch.d])
            && currentStoch.k < 20
            && currentRSI > 30
          ) return 'LONG'
          if (
            crossunder([prevStoch.k, currentStoch.k], [prevStoch.d, currentStoch.d])
            && currentStoch.k > 80
            && currentRSI > 70
          ) return 'SHORT'
        }
      }
    }
    return 'WAIT'
  }

  const getAnalyse = () => {
    const livePrices = this.getLivePrices()
    this.prices = _.mapValues(this.prices, (price, index) => [...price, livePrices[index]])
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
