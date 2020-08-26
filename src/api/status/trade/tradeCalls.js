const { utils, constants } = require('@goatfishes/utils')

/**
 * Make the appropriate exchange calls to execute the strategy
 * 
 * @param {object} strategyObject Contains all the necessary information to execute the trades [execute, symbol, leverage, side, orderQty, price, orderType, timeInForce]
 * @param {object} leverageObject Contains a mapping of a pair to its current leverage
 * @param {object} type Determines whether the execution is paperTrading or LiveTrading
 * 
 * @returns {object} updated leverageObject
 */
const tradeCalls = async (params) => {
    try {
        const { side, price, symbol, leverage, orderQty, orderType, timeInForce, timestamp } = params.strategyObject

        const { leverageObject, type } = params

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Keep track of all the symbol leverages`)
        if (!(symbol in leverageObject)) { 
            leverageObject[symbol] = leverage 
        }
        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Determine whether we have to modify leverage for the pair`)

        if (leverageObject[symbol] !== leverage) {

            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Request a leverage modification to the exchange`)
            const leverageBody = { botId: process.env.BOTNAME, symbol, leverage: parseInt(leverage) }
            if (type === "liveTrading") {
                const updatedLeverage = await utils.setLiveLeverage({ leverageBody, leverageObject })
                leverageObject[leverageBody.symbol] = updatedLeverage.leverage

            } else {
                const updatedLeverage = await utils.setPaperLeverage({ leverageBody, leverageObject })
                leverageObject[leverageBody.symbol] = updatedLeverage.leverage
            }
        }

        utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Submit order to the exchange`)
        const orderBody = { botId: process.env.BOTNAME, symbol, orderType, timeInForce, price, orderQty: parseInt(orderQty), side, timestamp }

        if (type === "liveTrading") {
            await utils.setLiveOrder({ orderBody, leverageObject })
        } else {

            await utils.setPaperOrder({ orderBody, leverageObject })
        }
        return { leverageObject }
    } catch (e) { throw new utils.ExceptionHandler(constants.RESPONSE_CODES.APPLICATION_ERROR, `Fatal error on live order setting : ${e}`) }
}

module.exports = { tradeCalls }
