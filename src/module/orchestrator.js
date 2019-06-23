const schedule = require('node-schedule')
const _ = require('lodash')
const Express = require('express')

const EVERY_MINUTE = '* * * * *'

const run = schedule.scheduleJob

module.exports = app => ({
  run: async () => {
    const server = new Express()

    const signals = []
    server.get('/', (req, res) => {
      res.json(signals)
    })

    server.listen(process.env.PORT || 3000, async () => {
      const { watch: traderWatch } = await app.module.trader

      const start = async () => {
        const tradeResult = await traderWatch()
        if (_.size(tradeResult)) {
          _.forEach(tradeResult, (p, symbol) => {
            console.log(
              symbol,
              p.action,
              'amount',
              p.amount,
              'at price',
              p.price,
              'stopLoss',
              p.stopLoss,
            )
            signals.push({
              symbol,
              action: p.action,
              amount: p.amount,
              price: p.price,
              stopLoss: p.stopLoss,
            })
          })
        }
      }

      run(EVERY_MINUTE, start)
    })
  },
})
