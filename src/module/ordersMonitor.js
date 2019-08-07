const _ = require('lodash')

const sleep = require('sleep-promise')

module.exports = app => {
  const checkOrder = async ({ order, orders, checks }) => {
    await sleep(this.check_timeout)
    if (checks === this.check) {
      console.log(`${order.id} order cancelled by timeout`)
      return this.removeOrder(order.id)
    }
    if (orders[order.symbol] && orders[order.symbol].find(p => p.type === 'limit')) {
      return checkOrder({ order, orders: await this.getOpenOrders(), checks: checks + 1 })
    }
    const {
      symbol, amount, side, stopLoss, price, action,
    } = order
    this.savePosition({
      symbol,
      amount,
      price,
      stopLoss,
      type: action,
    })
    console.log(` ${order.id} order executed! Adding stop loss.`)
    if (action === 'LONG') {
      const pair = this.pairs.find(p => p.symbol === symbol)
      const balance = await this.loadBalance()

      this.createStopLoss({
        symbol,
        amount: balance[pair.base],
        side,
        price: stopLoss,
      })
    } else {
      this.createStopLoss({
        symbol,
        amount,
        side,
        price: stopLoss,
      })
    }
    return {}
  }

  const checkOrders = async ordersToCheck => {
    const orders = await this.getOpenOrders()
    _.map(ordersToCheck, async order => {
      console.log(`${order.id} check if order was executed...`)
      checkOrder({ order, orders, checks: 0 })
    })
  }

  const init = async () => {
    const {
      getOpenOrders, removeOrder, loadBalance, getPairs, createStopLoss,
    } = await app.module
      .dataGateway

    const { ORDER_TIMEOUT, ORDER_CHECKS } = app.config.constants
    const { savePosition } = app.module.positionManager
    this.getOpenOrders = getOpenOrders
    this.removeOrder = removeOrder
    this.createStopLoss = createStopLoss
    this.savePosition = savePosition
    this.check_timeout = ORDER_TIMEOUT / ORDER_CHECKS
    this.check = ORDER_CHECKS
    this.pairs = getPairs()
    this.loadBalance = loadBalance
  }

  init()

  return {
    checkOrders,
  }
}
