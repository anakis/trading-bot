const _ = require('lodash')

module.exports = async app => {
  const manageLosses = async () => {
    const positions = await this.getOpenPositions()
    const orders = await this.getOpenOrders()

    await Promise.all(
      _.map(positions, position => {
        const orderBySymbol = orders[position.symbol]
        if (!orderBySymbol || orderBySymbol.find(o => o.type === 'stop')) {
          const {
            symbol, amount, stopLoss, price, type,
          } = position
          return this.savePosition({
            symbol,
            amount,
            price,
            stopLoss,
            type: type === 'LONG' ? 'SHORT' : 'LONG',
          })
        }
        return position
      }),
    )
  }

  const init = async () => {
    const { getOpenOrders } = await app.module.dataGateway
    const { getOpenPositions, savePosition } = app.module.positionManager
    this.getOpenPositions = getOpenPositions
    this.getOpenOrders = getOpenOrders
    this.savePosition = savePosition
  }

  await init()

  return {
    manageLosses,
  }
}
