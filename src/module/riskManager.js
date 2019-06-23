const _ = require('lodash')

module.exports = async app => {
  const calculateTradeRisk = (price, stopLoss) => 1 - Math.min(price, stopLoss) / Math.max(price, stopLoss)

  const assertPrecision = (value, reference) => {
    const precision = reference.toString().split('.')[1].length
    return parseFloat(value.toFixed(precision))
  }

  const calculateStopLoss = ({ price, atr, action }) => {
    let stopLoss = 0
    switch (action) {
      case 'LONG':
        stopLoss = price - 2 * atr
        break
      case 'SORT':
      default:
        stopLoss = price + 2 * atr
        break
    }
    return assertPrecision(stopLoss, price)
  }

  const calculateRisk = ({ price, action, atr }) => {
    const stopLoss = calculateStopLoss({ price, atr, action })
    const tradeRisk = calculateTradeRisk(price, stopLoss)
    return { stopLoss, tradeRisk }
  }

  const getRisk = () => {
    const risk = _.mapValues(this.getAnalyse(), ({ price, analyse: { action, atr } }) => ({
      price,
      action,
      ...calculateRisk({
        price,
        atr,
        action,
      }),
    }))
    return risk
  }

  const init = async () => {
    const { getAnalyse } = await app.module.analyser
    this.getAnalyse = getAnalyse

    return this
  }

  await init()

  return {
    getRisk,
  }
}
