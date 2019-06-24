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

  const trade = async opportunities => Promise.all(
    _.map(opportunities, async (opportunitie, symbol) => {
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

  const init = async () => {
    const { createOrder } = await app.module.dataGateway
    this.createOrder = createOrder
    return this
  }
  await init()

  return {
    trade,
  }
}
