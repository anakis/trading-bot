const schedule = require('node-schedule')
const _ = require('lodash')
const Express = require('express')

module.exports = app => ({
  run: async () => {
    const server = new Express()

    const signals = []
    server.get('/', (req, res) => {
      res.json(signals)
    })
    server.listen(process.env.PORT || 3000, async () => {
      const { getRisk } = await app.module.riskManager
      schedule.scheduleJob('* * * * *', () => {
        const risk = getRisk()
        _.forEach(risk, (r, symbol) => {
          if (r.action !== 'WAIT') {
            console.log(symbol, r.action, 'at', r.price, 'stopLoss', r.stopLoss)
            signals.push({
              symbol, action: r.action, price: r.price, stopLoss: r.stopLoss,
            })
          }
        })
      })
    })
  },
})
