const _ = require('lodash')

module.exports = async app => {
  const getTradeSide = action => {
    if (action === 'LONG') return 'buy'
    if (action === 'SHORT') return 'sell'
    return ''
  }

  const trade = async opportunities => {
    const orders = await this.getOpenOrders()
    const trades = await Promise.all(
      _.map(opportunities, async (opportunitie, symbol) => {
        const {
          amount, price, action, stopLoss,
        } = opportunitie

        const side = getTradeSide(action)

        try {
          let order = {}
          if (orders[symbol]) {
            const stopOrder = orders[symbol].find(p => p.type === 'stop')
            if (stopOrder) {
              await this.removeOrder(stopOrder.id)
              order = await this.createOrder({
                symbol,
                side,
                amount,
                price,
                stopOrder,
              })
            }
          } else {
            order = await this.createOrder({
              symbol,
              side,
              amount,
              price,
            })
          }

          console.log(
            `${
              order.id
            } [${side}] limit order on ${symbol}. Price: ${price}, stop loss: ${stopLoss}`,
          )
          return { ...order, stopLoss }
        } catch (e) {
          console.log(e.message)
          return {}
        }
      }),
    )

    return _.pickBy(trades, ({ id }) => id !== undefined)
  }

  const init = async () => {
    const { createOrder, getOpenOrders, removeOrder } = await app.module.dataGateway
    this.createOrder = createOrder
    this.getOpenOrders = getOpenOrders
    this.removeOrder = removeOrder
    return this
  }
  await init()

  return {
    trade,
  }
}
