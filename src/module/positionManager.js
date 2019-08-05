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

  const getOpenPositions = () => {
    const { Position } = app.models
    return Position.find({ status: 'open' }).exec()
  }

  const getProfits = async symbol => {
    const { Profit } = app.models
    const profits = await Profit.find({ symbol }).exec()
    return profits.map(({ value }) => value)
  }

  const hasOpenPosition = (index, positions) => positions.findIndex(({ symbol }) => symbol === index) !== -1

  const calcPositionSize = async ({ opportunities, balance, pairs }) => {
    let positionSize = {}

    const { QUOTE: quote } = app.config.constants

    positionSize = await Promise.all(
      _.map(opportunities, async (opportunitie, symbol) => {
        const {
          tradeRisk, price, action, stopLoss,
        } = opportunitie

        const { RISK_COEFFICIENT: accountRisk } = app.config.constants

        const profits = await getProfits(symbol)

        const kellyCriterietion = calculateKellyCriterietion(profits)

        const openPositions = await getOpenPositions()

        let amount = 0
        let feeCoefficient = 1
        if (!hasOpenPosition(symbol, openPositions)) {
          const riskPosition = calculateRiskPosition({
            tradeRisk,
            accountRisk,
            pairsSize: pairs.length,
            openedPositionSize: _.size(openPositions),
          })

          const pair = pairs.find(p => p.symbol === symbol)

          const minAmount = pair.limits.amount.min

          amount = Math.max(
            minAmount,
            (balance[quote] * Math.min(riskPosition, kellyCriterietion)) / price,
          )
          if (action === 'LONG') feeCoefficient += 0.002 / (1 - 0.002)

          amount *= feeCoefficient
        }
        return {
          price,
          action,
          amount,
          amountWithoutFee: amount / feeCoefficient,
          stopLoss,
          symbol,
        }
      }),
    )
    return _.pickBy(_.keyBy(positionSize, 'symbol'), ({ amount }) => amount !== 0)
  }

  const closePosition = id => {
    const { Position } = app.models
    return Position.findByIdAndUpdate(id, { status: 'closed' }).exec()
  }

  const createPosition = ({
    symbol, amount, price, stopLoss, type,
  }) => {
    const { Position } = app.models
    const position = new Position({
      symbol,
      amount,
      price,
      stopLoss,
      type,
    })
    position.save()
  }

  const calculateProfit = (oppenedPosition, newPosition) => {
    const { Profit } = app.models
    const profit = new Profit({
      symbol: newPosition.symbol,
      value: newPosition.price - oppenedPosition.price,
    })
    profit.save()
  }

  const savePosition = async ({
    symbol, amount, price, stopLoss, type,
  }) => {
    const position = {
      symbol,
      amount,
      price,
      stopLoss,
      type,
    }
    const { Position } = app.models
    const oppenedPosition = await Position.findOne({
      symbol,
      type: type === 'LONG' ? 'SHORT' : 'LONG',
      status: 'open',
    })

    if (oppenedPosition && oppenedPosition.id) {
      calculateProfit(oppenedPosition, position)
      closePosition(oppenedPosition.id)
    }
    createPosition(position)
  }
  return {
    calcPositionSize,
    savePosition,
    getOpenPositions,
  }
}
