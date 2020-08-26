const { utils, db, constants } = require('@goatfishes/utils')

/**
 * Watches the kafka topic of its exchange by using a consumer group to process all the pairs at the same time
 */
const stop = async () => {
    utils.logEvent(constants.LOG_LEVELS.INFO, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Retrieving all parameters to stop the previous process`)
    const botStats = await db.selectBotByBotId([process.env.BOTNAME])
    const botStatus = botStats[0]._status

    utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Current status = ${botStatus}`)
    switch (botStatus) {
        case 'Backtest':
            break;
        case 'PaperTrade':
            await utils.pauseConsumer(`${process.env.BOTNAME}PaperTradeGroup`)
            break;
        case 'LiveTrade':
            await utils.pauseConsumer(`${process.env.BOTNAME}Group`)
            break;
        case 'Stop':
            break;
        default:
            utils.logEvent(constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Invalid Status`)
    }
}

module.exports = { stop }
