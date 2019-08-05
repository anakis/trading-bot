const _ = require('lodash')

module.exports = () => {
  const getOpportunities = ({ risk, balance, pairs }) => _.pickBy(risk, ({ action }, index) => {
    if (action === 'SHORT') {
      const pair = pairs.find(p => p.symbol === index)
      return balance[pair.base] && balance[pair.base] >= pair.limits.amount.min
    }
    return true
  })

  return {
    getOpportunities,
  }
}
