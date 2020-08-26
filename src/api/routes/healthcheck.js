const Koa = require('koa')
const route = require('koa-route')
const { utils, constants } = require('@goatfishes/utils')

module.exports = async () => {
    const app = new Koa()
    
    /** 
     * Endpoint dedicated to return the health of the container when queried
     * 
     * @returns Code indicating the health, o lack thereof, of the container
     */
    app.use(route.get('/', async (ctx) => {
        try {
            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Validating the payload`)
            ctx.checkPayload(ctx, 'healthcheck')

            utils.logEvent(constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Strategy container is running`)
            ctx.status = 200
            ctx.body = {
                data: "OK"
            }
        } catch (e) { throw new utils.ExceptionHandler(constants.RESPONSE_CODES.APPLICATION_ERROR, `Fatal error on status set : ${e}`) }
    }))

    return app
}
