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

  const calcPositionSize = ({
    opportunities, balance, pairs, oppenedPositions, profits = {},
  }) => {
    let positionSize = {}

    const { QUOTE: quote } = app.config.constants

    positionSize = _.mapValues(opportunities, (opportunitie, index) => {
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

      let minAmount = 0
      const pair = pairs.find(p => p.symbol === index)

      if (action === 'LONG') minAmount = pair.limits.amount.min
      else minAmount = balance[pair.base]

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
