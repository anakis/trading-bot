const _ = require('lodash')

const sleep = require('sleep-promise')

module.exports = app => {
  const checkOrder = async ({ order, orders, checks }) => {
    await sleep(10000)
    if (checks === 5) {
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
    this.createStopLoss({
      symbol,
      amount,
      side,
      price: stopLoss,
    })
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
    const { getOpenOrders, removeOrder, createStopLoss } = await app.module.dataGateway
    const { savePosition } = app.module.positionManager
    this.getOpenOrders = getOpenOrders
    this.removeOrder = removeOrder
    this.createStopLoss = createStopLoss
    this.savePosition = savePosition
  }

  init()

  return {
    checkOrders,
  }
}
