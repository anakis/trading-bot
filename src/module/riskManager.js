const _ = require('lodash')

module.exports = async app => {
  const calculateStopLoss = ({ price, action, atr }) => {
    switch (action) {
      case 'LONG':
        return { price, action, stopLoss: price - 2 * atr }
      case 'SHORT':
        return { price, action, stopLoss: price + 2 * atr }
      case 'WAIT':
      default:
        return { price, action }
    }
  }

  const getRisk = () => {
    const risk = _.mapValues(this.getAnalyse(), ({ price, analyse: { action, atr } }) => calculateStopLoss({
      price,
      action,
      atr,
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
