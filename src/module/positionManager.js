const _ = require('lodash')

module.exports = async app => {
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

  const calcPositionSize = async (profits = {}) => {
    const risks = this.getRisk()
    const opportunities = _.pickBy(risks, ({ action }) => action !== 'WAIT')
    let positionSize = {}
    if (_.size(opportunities) > 0) {
      const { loadQuoteBalances, getPairs } = await app.module.dataReceiver
      const { free: balance } = await loadQuoteBalances()
      const pairs = getPairs()

      positionSize = _.mapValues(opportunities, (opportunitie, index) => {
        const {
          tradeRisk, price, action, stopLoss,
        } = opportunitie

        const { RISK_COEFFICIENT: accountRisk } = app.config.constants

        const kellyCriterietion = calculateKellyCriterietion(profits[index])

        const riskPosition = calculateRiskPosition({
          tradeRisk,
          accountRisk,
          pairsSize: _.size(risks),
          openedPositionSize: _.size(this.positions),
        })

        const minAmount = pairs.find(pair => pair.symbol === index).limits.amount.min

        const amount = Math.max(
          minAmount,
          (balance * Math.min(riskPosition, kellyCriterietion)) / price,
        )

        return {
          price,
          action,
          amount,
          stopLoss,
        }
      })
    }
    return positionSize
  }

  const managePositions = positions => {
    const kept = _.omit(this.positions, Object.keys(positions))
    const closed = _.pick(this.positions, Object.keys(positions))

    this.positions = { ...kept, ...positions }
    return {
      kept,
      closed,
    }
  }

  const getPositions = () => this.positions

  const init = async () => {
    const { getRisk } = await app.module.riskManager
    this.getRisk = getRisk
    this.positions = {}
    return this
  }

  await init()

  return {
    calcPositionSize,
    managePositions,
    getPositions,
  }
}
