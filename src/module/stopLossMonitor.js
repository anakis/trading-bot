const _ = require('lodash')

module.exports = () => {
  const getLosses = (oppenedOrders, lastPrices) => {
    _.pickBy(oppenedOrders, (orders, index) => lastPrices[index].ohlcv[3] > oppenedOrders.price)
  }

  return {
    getLosses,
  }
}
