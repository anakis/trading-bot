const ccxt = require('ccxt')

const Api = require('bitfinex-api-node')

const sleep = require('sleep-promise')

const _ = require('lodash')

const exchangeConfig = {
  timeout: 30000,
  enableRateLimit: true,
}

const wsConfig = {
  autoReconnect: true,
  seqAudit: true,
  packetWDDelay: 10 * 1000,
  transform: true,
}

class MarketError extends Error {
  constructor(message) {
    super(message)

    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = () => {
  const exchange = new ccxt.bitfinex2(exchangeConfig)

  const liveCandles = {}

  const ws = new Api({
    ws: wsConfig,
  }).ws()

  const _createFormattedPair = (base, quote) => {
    if (!exchange.markets) throw new MarketError('Market is undefined')

    const symbol = `${base}/${quote}`

    try {
      const { id: symbolSanitized, baseId: baseSanitized } = exchange.markets[symbol]

      return {
        symbol,
        symbolSanitized,
        base,
        baseSanitized,
        quote,
      }
    } catch (error) {
      throw new MarketError(`Symbol '${symbol}' not found`)
    }
  }

  const _getTimeFrameByPass = (timeframe, timestamp = 0) => {
    const numericPart = timeframe.match(/[0-9]+/g)

    const aplhabeticPart = timeframe.match(/^[0-9]+/g)

    let milliseconds = 0

    switch (aplhabeticPart) {
      case 'h':
        milliseconds = 60 * 60 * 1000
        break
      case 'D':
        milliseconds = 24 * 60 * 60 * 1000
        break
      case 'm':
      default:
        milliseconds = 60 * 1000
        break
    }

    return timestamp + milliseconds * parseFloat(numericPart)
  }

  const _getSymbolFormatted = symbol => {
    const { symbol: symbolSanitized } = exchange.findMarket(symbol)
    return symbolSanitized
  }

  const _getOHLCV = async ({ symbol, timeframe, timestamp }) => {
    let ohlcvSanitized = []
    let startedTimestamp = timestamp

    while (true) {
      const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, startedTimestamp, 1000)

      await sleep(3000)

      if (ohlcv && ohlcv.length > 0) {
        const ohlcvMaped = ohlcv.map(c => ({
          timestamp: c[0],
          ohlcv: c.slice(1),
        }))

        ohlcvSanitized = [...ohlcvSanitized, ...ohlcvMaped]

        startedTimestamp = _getTimeFrameByPass(
          timeframe,
          ohlcvSanitized[ohlcvSanitized.length - 1].timestamp,
        )
      } else break
    }
    return ohlcvSanitized
  }

  const loadMarket = async () => {
    await exchange.loadMarkets()
  }

  const getTickers = async pairs => {
    const tickers = await exchange.fetchTickers(pairs.map(pair => pair.symbol))
    return tickers
  }

  const getPairsWithBigVolume = async (pairs, quantitiy = 10) => {
    const tickers = await getTickers(pairs)

    const tickersOrdered = _.orderBy(tickers, [t => t.baseVolume * ((t.bid + t.ask) / 2)], ['desc'])

    const tickersOrderedLimited = tickersOrdered.slice(0, quantitiy)

    const filteredPairs = pairs.filter(
      p => tickersOrderedLimited
        .slice(0, 10)
        .map(t => t.symbol)
        .indexOf(p.symbol) !== -1,
    )

    return filteredPairs
  }

  const getFormattedPairs = ({ bases, quote }) => {
    let pairs = []
    try {
      bases.forEach(base => {
        pairs = [...pairs, _createFormattedPair(base, quote)]
      })
    } catch (error) {
      throw new Error(error)
    }

    return pairs
  }

  const getPairsByQuote = quote => {
    let pairs = []
    try {
      const bases = _.filter(exchange.markets, market => market.quote === quote).map(m => m.base)
      pairs = getFormattedPairs({ bases, quote })
    } catch (error) {
      throw new Error(error)
    }

    return pairs
  }

  const getConsolidatedPrices = async ({ pairs, timeframe, timestamp }) => {
    const pricesArray = await Promise.all(
      pairs.map(async pair => {
        const { symbol } = pair

        const ohlcv = await _getOHLCV({
          symbol,
          timeframe,
          timestamp,
        })

        return [symbol, ohlcv]
      }),
    )

    const prices = _.fromPairs(pricesArray)

    return prices
  }

  const resetPrice = symbol => {
    liveCandles[symbol] = {
      o: undefined,
      h: undefined,
      l: undefined,
      c: undefined,
    }
  }

  const updateLiveCandle = (data, { symbol }) => {
    const key = _getSymbolFormatted(symbol)

    const close = data.lastPrice

    liveCandles[key].c = close

    if (liveCandles[key].o === undefined) liveCandles[key].o = liveCandles[key].c
    if (liveCandles[key].l === undefined) liveCandles[key].l = liveCandles[key].c
    if (liveCandles[key].h === undefined) liveCandles[key].h = liveCandles[key].c

    liveCandles[key].l = Math.min(liveCandles[key].l, liveCandles[key].c)
    liveCandles[key].h = Math.max(liveCandles[key].h, liveCandles[key].c)
  }

  const watchLivePrices = pairs => {
    ws.on('error', error => {
      console.log('error', error)
    })

    return new Promise(async resolve => {
      ws.once('open', () => {
        pairs.forEach(pair => {
          const { symbol, symbolSanitized } = pair
          resetPrice(symbol)
          ws.subscribeTicker(symbolSanitized)
          ws.onTicker({ symbol: symbolSanitized }, updateLiveCandle)
        })
        console.log('Live prices watcher started')
        resolve(true)
      })

      ws.open()
    })
  }

  const getLivePrices = () => {
    const live = { ...liveCandles }
    _.forEach(liveCandles, (candle, key) => {
      resetPrice(key)
    })
    return live
  }

  return {
    loadMarket,
    getTickers,
    getPairsWithBigVolume,
    getPairsByQuote,
    getFormattedPairs,
    getConsolidatedPrices,
    watchLivePrices,
    getLivePrices,
  }
}
