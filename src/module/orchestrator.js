const schedule = require('node-schedule')
const _ = require('lodash')
const Express = require('express')

module.exports = app => ({
  run: async () => {
    const server = new Express()

    server.get('/', (req, res) => {
      res.end('Running...')
    })
    server.listen(process.env.PORT || 3000, async () => {
      const { getAnalyse } = await app.module.analyser
      schedule.scheduleJob('* * * * *', () => {
        const analyse = getAnalyse()
        // console.log(analyse)
        _.forEach(analyse, (a, symbol) => {
          if (a.analyse !== 'WAIT') {
            console.log(symbol, a.analyse, a.price)
          }
        })
        // console.log(result)
      })
    })
  },
})
