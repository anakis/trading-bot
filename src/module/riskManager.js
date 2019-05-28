const _ = require('lodash')

module.exports = async app => {
  const calculateTradeRisk = (price, stopLoss) => 1 - Math.min(price, stopLoss) / Math.max(price, stopLoss)

  const calculateStopLoss = ({ price, atr, action }) => {
    switch (action) {
      case 'LONG':
        return price - 2 * atr
      case 'SHORT':
      default:
        return price + 2 * atr
    }
  }

  const calculateRisk = ({ price, action, atr }) => {
    if (action !== 'WAIT') {
      const stopLoss = calculateStopLoss({ price, atr, action })
      const tradeRisk = calculateTradeRisk(price, stopLoss)
      return { stopLoss, tradeRisk }
    }
    return {}
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
