const _ = require('lodash')

module.exports = async app => {
  const manageLosses = async () => {
    const positions = await this.getOpenPositions()
    const orders = await this.getOpenOrders()

    _.map(positions, position => {
      const orderBySymbol = orders[position.symbol]
      if (!orderBySymbol || orderBySymbol.find(o => o.type === 'stop')) {
        const {
          symbol, amount, stopLoss, price, action,
        } = orderBySymbol
        this.savePosition({
          symbol,
          amount,
          price,
          stopLoss,
          type: action,
        })
      }
    })
  }

  const init = async () => {
    const { getOpenOrders } = await app.module.dataGateway
    const { getOpenPositions } = app.module.positionManager
    this.getOpenPositions = getOpenPositions
    this.getOpenOrders = getOpenOrders
  }

  await init()

  return {
    manageLosses,
  }
}
