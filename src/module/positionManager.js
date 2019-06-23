const _ = require('lodash')

module.exports = app => {
  const calculateRiskPosition = ({
    tradeRisk, accountRisk, pairsSize, openedPositionSize,
  }) => {
    const minTradeRisk = Math.min(tradeRisk, accountRisk)
    const maxTradeRisk = Math.max(tradeRisk, accountRisk)
    return minTradeRisk / maxTradeRisk / (pairsSize - openedPositionSize)
  }

  const calculateKellyCriterietion = (profits = []) => {
    const { KELLY_CRITERIETION_DEFAULT } = app.config.constants
    if (profits.length >= 50) {
      const winnings = profits.filter(profit => profit >= 0)
      const losses = profits.filter(profit => profit < 0).map(profit => Math.abs(profit))
      const winProbability = winnings.length / (winnings.length + losses.length)

      const winningAvg = winnings.reduce((a, b) => a + b) / winnings.length
      const lossesAvg = losses.reduce((a, b) => a + b) / losses.length

      const winLossRatio = winningAvg / lossesAvg

      return Math.abs((winProbability - (1 - winProbability)) / winLossRatio) / 2
    }
    return KELLY_CRITERIETION_DEFAULT
  }

  const filterOpportunities = ({ opportunities, balance, pairs }) => _.pickBy(opportunities, ({ action }, index) => {
    if (action === 'SHORT') {
      const pair = pairs.find(p => p.symbol === index)
      return balance[pair.base] && balance[pair.base] >= pair.limits.amount.min
    }
    return true
  })

  const calcPositionSize = async (opportunities, oppenedPositions, profits = {}) => {
    let positionSize = {}
    const { loadBalance, getPairs } = await app.module.dataGateway
    const { QUOTE: quote } = app.config.constants
    const balance = await loadBalance()
    const pairs = getPairs()

    const realOpportunities = filterOpportunities({ opportunities, balance, pairs })

    positionSize = _.mapValues(realOpportunities, (opportunitie, index) => {
      const {
        tradeRisk, price, action, stopLoss,
      } = opportunitie

      const { RISK_COEFFICIENT: accountRisk } = app.config.constants

      const kellyCriterietion = calculateKellyCriterietion(profits[index])

      const riskPosition = calculateRiskPosition({
        tradeRisk,
        accountRisk,
        pairsSize: pairs.length,
        openedPositionSize: _.size(oppenedPositions),
      })

      const minAmount = pairs.find(pair => pair.symbol === index).limits.amount.min

      const amount = Math.max(
        minAmount,
        (balance[quote] * Math.min(riskPosition, kellyCriterietion)) / price,
      )

      return {
        price,
        action,
        amount,
        stopLoss,
      }
    })

    return positionSize
  }


  return {
    calcPositionSize,
  }
}
