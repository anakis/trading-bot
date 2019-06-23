const _ = require('lodash')

module.exports = async app => {
  const findOpportunities = async () => {
    const risks = this.getRisk()
    return _.pickBy(risks, ({ action }) => action !== 'WAIT')
  }

  const hasOpportunities = opportunities => _.size(opportunities) > 0

  const getTradeSide = action => {
    if (action === 'LONG') return 'buy'
    if (action === 'SHORT') return 'sell'
    return ''
  }

  const watch = async () => {
    const opportunities = await findOpportunities()

    if (hasOpportunities(opportunities)) {
      const opportunitiesWithPositionSize = await this.calcPositionSize(opportunities, {})

      const opennedOrders = await Promise.all(
        _.map(opportunitiesWithPositionSize, async (opportunitie, symbol) => {
          const { amount, price, action } = opportunitie

          const side = getTradeSide(action)

          try {
            const order = await this.createOrder({
              symbol,
              side,
              amount,
              price,
            })
            return order
          } catch (e) {
            return e
          }
        }),
      )

      return opennedOrders
    }
    return {}
  }

  const init = async () => {
    const { getRisk } = await app.module.riskManager
    const { createOrder } = await app.module.dataGateway
    const { calcPositionSize } = app.module.positionManager
    this.getRisk = getRisk
    this.createOrder = createOrder
    this.calcPositionSize = calcPositionSize
    return this
  }
  await init()

  return {
    watch,
  }
}
