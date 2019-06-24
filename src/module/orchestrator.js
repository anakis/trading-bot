const schedule = require('node-schedule')
const _ = require('lodash')
const Express = require('express')

const EVERY_MINUTE = '* * * * *'

const job = schedule.scheduleJob

module.exports = async app => {
  const run = async () => {
    const server = new Express()

    const signals = []
    server.get('/', (req, res) => {
      res.json(signals)
    })

    const oppenedOrders = {}

    const start = async () => {
      this.prices = this.getLivePrices() // get prices array
      const lastPrices = _.mapValues(this.prices, price => price[price.length - 1])
      const losses = this.getLosses(oppenedOrders, lastPrices) // get losses
      if (_.size(losses) !== 0) {
        await this.trade(losses)
      }
      const analyse = this.getAnalyse(this.prices) // get analyse of each pair
      if (_.size(analyse) !== 0) {
        const risk = this.getRisk(analyse) // get risk of a analyse
        const balance = await this.loadBalance()
        const { pairs } = this
        const opportunities = this.getOpportunities({ risk, balance, pairs })
        if (_.size(opportunities) !== 0) {
          const opportunitiesWithPositionSize = this.calcPositionSize({
            opportunities,
            balance,
            pairs,
            oppenedPositions: {},
          })
          const orders = await this.trade(opportunitiesWithPositionSize)
          console.log(orders)
        }
      }
    }

    server.listen(process.env.PORT || 3000, async () => {
      job(EVERY_MINUTE, start)
    })
  }

  const init = async () => {
    const { getLivePrices, loadBalance, getPairs } = await app.module.dataGateway
    const { getAnalyse } = app.module.analyser
    const { getRisk } = app.module.riskManager
    const { getOpportunities } = app.module.opportunitiesMonitor
    const { getLosses } = app.module.stopLossMonitor
    const { calcPositionSize } = app.module.positionManager
    const { trade } = await app.module.trader
    this.getLivePrices = getLivePrices
    this.getAnalyse = getAnalyse
    this.getRisk = getRisk
    this.getOpportunities = getOpportunities
    this.getLosses = getLosses
    this.loadBalance = loadBalance
    this.calcPositionSize = calcPositionSize
    this.trade = trade
    this.pairs = getPairs()
  }

  await init()

  return {
    run,
  }
}
