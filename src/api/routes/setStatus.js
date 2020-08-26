const Koa = require('koa')
const route = require('koa-route')
const { stop } = require('../status/stop/stop')
const { trade } = require('../status/trade/trade')
const { backtest } = require('../status/backtest/backtest')
const { utils, constants, db } = require('@goatfishes/utils')

module.exports = async () => {
    const app = new Koa()

    /**
     * Endpoint dedicated to changing or setting the state of the strategy
     * 
     * @param {string} status Determine the state of the strategy.
     * @param {string} [timeFrame] Candle size for the backtest
     * @param {string} [symbol] Backtesting pair
     * @param {string} [exchange] Exchange to execute the backtest on
     * 
     * @returns {object} Specifying the botId and the updated state of the bot 
     */
    app.use(route.post('/', async (ctx) => {
        try {
            const status = await ctx.request.query.status

            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
            const payload = ctx.checkPayload(ctx, 'status')
            const { timeFrame, symbol, exchange } = payload


            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Stop the bots actions before setting a new state`)
            await stop()

            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Update the state of the bot in the database`)
            await db.updateBotStrategyStatus([status, process.env.BOTNAME])

            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Updating bot status`)
            switch (status) {
                case 'Backtest':
                    backtest({ timeFrame, symbol, exchange })
                    break;
                case 'PaperTrade':
                    trade({type:"paperTrade"})
                    break;
                case 'LiveTrade':
                    trade({type:"liveTrading"})                    
                    break;
                case 'Stop':
                    break;
                default:
                    throw new utils.ExceptionHandler(constants.RESPONSE_CODES.BAD_REQUEST, 'No valid status provided')
            }
            ctx.status = 200
            ctx.body = {
                data: {
                    botId: process.env.BOTNAME,
                    message: `Status updated to ${status}`
                }
            }
        } catch (e) { throw new utils.ExceptionHandler(constants.RESPONSE_CODES.APPLICATION_ERROR, `Fatal error on status set : ${e}`) }
    }))

    return app
}
