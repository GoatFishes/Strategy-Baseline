const { testStats } = require('./backtestAnalyser.js')
const { utils, constants, db } = require('@goatfishes/utils')
const { strategy } = require(`../../strategies/${process.env.BOTNAME}`)

/**
 * Cleans all the previous backtesting information first and the proceeds to perform a backtest based on the bots strategy
 * 
 * @param {string} timeFrame Binsize for the candles we will be retrieving
 * @param {string} symbol Symbol to watch
 * @param {string} exchange Exchnage from which we will be retrieving the calls
 * 
 * @todo Remove the clean trade, we want to keep the history of a backtest, we don't want to keep all the trades for a backtest also add and delete by botId
 */
const backtest = async (params) => {
    try {
        const { timeFrame, symbol, exchange } = params
        const prices = []
        let counter = 0
        let allTrades = []
        let strategyObject = {}

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Clean backtest trade history`)
        await db.cleanTrade()

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Select all past pricePoints already stored in the databse`)
        const pricePoints = await db.selectAllPriceHistory([timeFrame, symbol, exchange])

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Populate arrays with the historic pricePoints and execute strategy`)
        for (let i = 0; i < pricePoints.length; i += 1) {
            prices.push({open: pricePoints[i]._open, close: pricePoints[i]._close, high: pricePoints[i]._high, low: pricePoints[i]._low, timestamp: (pricePoints[i]._timestamp).toISOString()})
            strategyObject = await strategy(prices)
            if (strategyObject.execute) {
                utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Executing a trade`)
                allTrades.push(Object.values(strategyObject))

                counter += 1

                if (counter === 10) {
                    utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Persisting a subset of trades`)
                    await db.insertTrade(allTrades)
                    allTrades = []
                    counter = 0
                }
            }
        }
        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Persist remaining orders to the database`)
        await db.insertTrade(allTrades)

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Get analytics on all the trades the strategy has performed`)
        await testStats()

    } catch (e) { throw new utils.ExceptionHandler(constants.RESPONSE_CODES.APPLICATION_ERROR, `Fatal error on status set : ${e}`) }
}

module.exports = { backtest }
