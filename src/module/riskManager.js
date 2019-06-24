const _ = require('lodash')

module.exports = () => {
  const getTradeRisk = (price, stopLoss) => 1 - Math.min(price, stopLoss) / Math.max(price, stopLoss)

  const assertPrecision = (value, reference) => {
    const precision = reference.toString().split('.')[1].length
    return parseFloat(value.toFixed(precision))
  }

  const getStopLoss = ({ price, atr, action }) => {
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
    const stopLoss = getStopLoss({ price, atr, action })
    const tradeRisk = getTradeRisk(price, stopLoss)
    return { stopLoss, tradeRisk }
  }

  const getRisk = analyse => {
    const risk = _.mapValues(analyse, ({ price, analyse: { action, atr } }) => ({
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

  return {
    getRisk,
  }
}
