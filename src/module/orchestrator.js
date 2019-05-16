module.exports = app => ({
  run: async () => {
    const { getPrices, getLivePrices } = await app.module.dataReceiver
    const prices = await getPrices()
    console.log(prices)
    setInterval(() => {
      console.warn(getLivePrices())
    }, 1000)
  },
})
