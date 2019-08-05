const schedule = require('node-schedule')
const _ = require('lodash')
const Express = require('express')

const EVERY_MINUTE = '* * * * *'

const job = schedule.scheduleJob

module.exports = async app => {
  const run = async () => {
    const server = new Express()

    server.get('/', (req, res) => {
      res.send('Trading bot is running!')
    })

    const start = async () => {
      this.prices = this.getLivePrices() // get prices array
      // const orders = await this.getOpenOrders()
      await this.manageLosses() // get losses
      const analyse = this.getAnalyse(this.prices) // get analyse of each pair
      if (_.size(analyse) !== 0) {
        const risk = this.getRisk(analyse) // get risk of a analyse
        const balance = await this.loadBalance()
        const { pairs } = this
        const opportunities = this.getOpportunities({ risk, balance, pairs })
        if (_.size(opportunities) !== 0) {
          const opportunitiesWithPositionSize = await this.calcPositionSize({
            opportunities,
            balance,
            pairs,
          })
          if (_.size(opportunitiesWithPositionSize) !== 0) {
            const newOrders = await this.trade(opportunitiesWithPositionSize)
            this.checkOrders(newOrders)
          }
        }
      }
    }

    server.listen(process.env.PORT || 3000, async () => {
      job(EVERY_MINUTE, start)
    })
  }

  const init = async () => {
    const {
      getLivePrices, loadBalance, getPairs, getOpenOrders,
    } = await app.module.dataGateway
    const { getAnalyse } = app.module.analyser
    const { getRisk } = app.module.riskManager
    const { checkOrders } = app.module.ordersMonitor
    const { getOpportunities } = app.module.opportunitiesMonitor
    const { manageLosses } = await app.module.stopLossMonitor
    const { calcPositionSize } = app.module.positionManager
    const { trade } = await app.module.trader
    this.getLivePrices = getLivePrices
    this.getAnalyse = getAnalyse
    this.getRisk = getRisk
    this.getOpportunities = getOpportunities
    this.manageLosses = manageLosses
    this.loadBalance = loadBalance
    this.calcPositionSize = calcPositionSize
    this.trade = trade
    this.getOpenOrders = getOpenOrders
    this.checkOrders = checkOrders
    this.pairs = getPairs()
  }

  await init()

  return {
    run,
  }
}
