const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
chai.use(chaiHttp)
const { db } = require('@goatfishes/utils')
const { main } = require('./api/app')
let server

const kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' }),
    producer = new Producer(client)

const keys = {
    "apiKeyID": process.env.API_KEY_ID,
    "apiKeySecret": process.env.API_KEY_SECRET
}


sleep = m => new Promise(r => setTimeout(r, m))


describe('Strategy Baseline', async () => {
    before(async () => {
        const app = await main()
        server = app.listen(3008)
    })

    after(() => {
        server.close()
    })

    describe('healthcheck', () => {
        describe('Correct input', async () => {
            let res
            before(async () => {
                res = await chai
                    .request(server)
                    .get('/healthcheck')
            })

            it('Should return 200 when calling /healthcheck for the container', async () => {
                expect(res).to.have.status(200)
            })

            it('Should return the correct message', () => {
                expect(res.text).to.eql('{"data":"OK"}');
            })
        })
    })

    describe('Set status', async () => {
        var res

        before(async () => {
            await db.insertBotStrategy(["defaultKeys", "", 0.0, 0.0, '3009', `["1mXBTUSD", "5mXBTUSD"]`, 'Stop'])
            await db.insertBotKeys(["defaultKeys", keys, "bitmex"])
        })

        describe('LiveTrade', async () => {
            before(async () => {
                res = await chai
                    .request(server)
                    .post('/setstatus?status=LiveTrade')
                    .set('content-type', 'application/json')
                    .send({})
            })

            it('Call /setstatus with status LiveTrade', async () => {
                expect(res).to.have.status(200)
                await sleep(2500)
            })

            it('Call /setstatus with status LiveTrade', async () => {
                expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to LiveTrade"}}');
                await sleep(2500)
            })
            it('Ensure order has been pushed to exchange and database', async () => {
                let topic = "bitmexPriceStream"
                payloads = [
                    { topic: topic, messages: '{"timestamp":"2020-05-29T07:25:00.000Z", "symbol":"1mXBTUSD", "open":776, "close":777,"high":777, "low":776, "volume":20 }', partition: 0 },
                ]
                await producer.send(payloads, async function (err, data) { })
                await sleep(1500)
                let orders = await db.selectOrders()
                expect(orders[0]).to.have.property("botId");
                expect(orders[0]).to.have.property("exchange");
                expect(orders[0]).to.have.property("order_id");
                expect(orders[0]).to.have.property("position_ref");
                expect(orders[0]).to.have.property("_timestamp");
                expect(orders[0]).to.have.property("order_status");
                expect(orders[0]).to.have.property("side");
                expect(orders[0]).to.have.property("size");
                expect(orders[0]).to.have.property("_price");
                expect(orders[0]).to.have.property("margin");
                expect(orders[0].margin).to.eql(0.00382450331125828);
                expect(orders[0]).to.have.property("leverage");
                expect(orders[0]).to.have.property("order_type");
                expect(orders[0]).to.have.property("average_price");
            })
        })

        describe('PaperTrade', async () => {
            describe('Carry out paper trading period', async () => {
                before(async () => {
                    res = await chai
                        .request(server)
                        .post('/setstatus?status=PaperTrade')
                        .set('content-type', 'application/json')
                        .send({})
                })

                it('Call /setstatus with status LiveTrade', async () => {
                    expect(res).to.have.status(200)
                    await sleep(2500)
                })

                it('Call /setstatus with status LiveTrade', async () => {
                    expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to PaperTrade"}}');
                    await sleep(2500)
                })
                it('Ensure order has been pushed to exchange and database', async () => {
                    let topic = "bitmexPriceStream"
                    payloads = [
                        { topic: topic, messages: '{"timestamp":"2020-05-29T07:25:00.000Z", "symbol":"1mXBTUSD", "open":776, "close":777,"high":777, "low":776, "volume":20 }', partition: 0 },
                    ]
                    await producer.send(payloads, async function (err, data) { })
                    await sleep(1500)
                    let orders = await db.selectPaperOrders()
                    expect(orders[0]).to.have.property("bot_id");
                    expect(orders[0]).to.have.property("exchange");
                    expect(orders[0]).to.have.property("order_id");
                    expect(orders[0]).to.have.property("position_ref");
                    expect(orders[0]).to.have.property("_timestamp");
                    expect(orders[0]).to.have.property("order_status");
                    expect(orders[0]).to.have.property("side");
                    expect(orders[0]).to.have.property("size");
                    expect(orders[0]).to.have.property("_price");
                    expect(orders[0]).to.have.property("margin");
                    expect(orders[0].margin).to.eql(0.0128865979381443);
                    expect(orders[0]).to.have.property("leverage");
                    expect(orders[0]).to.have.property("order_type");
                    expect(orders[0]).to.have.property("average_price");
                })
            })
            describe('Carry out a secondary paper trading period', async () => {
                before(async () => {
                    res = await chai
                        .request(server)
                        .post('/setstatus?status=PaperTrade')
                        .set('content-type', 'application/json')
                        .send({})
                })

                it('Call /setstatus with status LiveTrade', async () => {
                    expect(res).to.have.status(200)
                    await sleep(2500)
                })

                it('Call /setstatus with status LiveTrade', async () => {
                    expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to PaperTrade"}}');
                    await sleep(2500)
                })
                it('Ensure order has been pushed to exchange and database', async () => {
                    let topic = "bitmexPriceStream"
                    payloads = [
                        { topic: topic, messages: '{"timestamp":"2020-05-29T07:25:00.000Z", "symbol":"1mXBTUSD", "open":776, "close":777,"high":777, "low":776, "volume":20 }', partition: 0 },
                    ]
                    for (let i = 0; i < 51; i += 1) {
                        await producer.send(payloads, async function (err, data) { })
                    }
                    await sleep(1500)
                    let orders = await db.selectPaperOrders()
                    expect(orders[0]).to.have.property("bot_id");
                    expect(orders[0]).to.have.property("exchange");
                    expect(orders[0]).to.have.property("order_id");
                    expect(orders[0]).to.have.property("position_ref");
                    expect(orders[0]).to.have.property("_timestamp");
                    expect(orders[0]).to.have.property("order_status");
                    expect(orders[0]).to.have.property("side");
                    expect(orders[0]).to.have.property("size");
                    expect(orders[0]).to.have.property("_price");
                    expect(orders[0]).to.have.property("margin");
                    expect(orders[0].margin).to.eql(0.0128865979381443);
                    expect(orders[0]).to.have.property("leverage");
                    expect(orders[0]).to.have.property("order_type");
                    expect(orders[0]).to.have.property("average_price");
                })
            })
        })

        describe('Backtest', async () => {
            let res
            describe('Backtest - Long default position ', async () => {
                before(async () => {
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:25:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:26:00.000Z", 778, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:27:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:28:00.000Z", 778, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:29:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:30:00.000Z", 778, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:31:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:32:00.000Z", 778, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:33:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:34:00.000Z", 778, 778, 778, 778, 20])

                    res = await chai
                        .request(server)
                        .post('/setstatus?status=Backtest')
                        .set('content-type', 'application/json')
                        .send({ "timeFrame": "1m", "symbol": "XBT", "exchange": "Bitmex" })
                    await sleep(1000)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res).to.have.status(200)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to Backtest"}}');
                })

                it('Persist results to the database', async () => {
                    await sleep(1500)
                    let data = await db.selectPerformance()
                    console.log(data)
                    // Ensure forma integrity
                    expect(data[0]).to.have.property("avg_time")
                    expect(data[0]).to.have.property("average_profit")
                    expect(data[0]).to.have.property("overall_profit")
                    expect(data[0]).to.have.property("number_of_trades")
                    expect(data[0]).to.have.property("sharpe_ratio")
                    expect(data[0]).to.have.property("longest_trade")
                    expect(data[0]).to.have.property("shortest_trade")
                    expect(data[0]).to.have.property("best_trade")
                    expect(data[0]).to.have.property("worst_trade")

                    // Ensure Ciorrectness of calcs
                    expect(data[0].average_profit).to.eql(-0.26)
                    expect(data[0].overall_profit).to.eql(-1.29)
                    expect(data[0].number_of_trades).to.eql(10)
                    expect(data[0].sharpe_ratio).to.eql(-0.33)
                    expect(data[0].avg_time).to.eql(1.67)
                    expect(data[0].longest_trade).to.eql(2)
                    expect(data[0].shortest_trade).to.eql(1)
                    expect(data[0].best_trade).to.eql(-0.26)
                    expect(data[0].worst_trade).to.eql(-0.26)
                })
            })

            describe('Backtest - Short default position ', async () => {
                before(async () => {
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:25:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:26:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:27:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:28:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:29:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:30:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:31:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:32:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:33:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:34:00.000Z", 776, 778, 778, 778, 20])

                    res = await chai
                        .request(server)
                        .post('/setstatus?status=Backtest')
                        .set('content-type', 'application/json')
                        .send({ "timeFrame": "1m", "symbol": "XBT", "exchange": "Bitmex" })
                    await sleep(1000)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res).to.have.status(200)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to Backtest"}}');
                })

                it('Persist results to the database', async () => {
                    await sleep(1000)
                    let data = await db.selectPerformance()
                    // Ensure forma integrity
                    expect(data[0]).to.have.property("avg_time")
                    expect(data[0]).to.have.property("average_profit")
                    expect(data[0]).to.have.property("overall_profit")
                    expect(data[0]).to.have.property("number_of_trades")
                    expect(data[0]).to.have.property("sharpe_ratio")
                    expect(data[0]).to.have.property("longest_trade")
                    expect(data[0]).to.have.property("shortest_trade")
                    expect(data[0]).to.have.property("best_trade")
                    expect(data[0]).to.have.property("worst_trade")

                    // Ensure Ciorrectness of calcs
                    expect(data[0].average_profit).to.eql(0.05)
                    expect(data[0].overall_profit).to.eql(0.52)
                    expect(data[0].number_of_trades).to.eql(20)
                    expect(data[0].sharpe_ratio).to.eql(-0.3)
                    expect(data[0].avg_time).to.eql(0.8)
                    expect(data[0].longest_trade).to.eql(1)
                    expect(data[0].shortest_trade).to.eql(0)
                    expect(data[0].best_trade).to.eql(0.26)
                    expect(data[0].worst_trade).to.eql(-0.26)
                })
            })

            describe('Backtest - Consecutive Longs and Shorts ', async () => {
                before(async () => {
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:25:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:26:00.000Z", 778, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:27:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:28:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:25:00.000Z", 776, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:26:00.000Z", 776, 778, 778, 778, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:27:00.000Z", 778, 776, 776, 776, 20])
                    await db.insertPriceHistory(["XBT", "1m", "Bitmex", "2020-05-29T07:28:00.000Z", 778, 778, 778, 778, 20])

                    res = await chai
                        .request(server)
                        .post('/setstatus?status=Backtest')
                        .set('content-type', 'application/json')
                        .send({ "timeFrame": "1m", "symbol": "XBT", "exchange": "Bitmex" })
                    await sleep(1000)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res).to.have.status(200)
                })

                it('Call /setstatus with status Backtest', async () => {
                    expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to Backtest"}}');
                })

                it('Persist results to the database', async () => {
                    await sleep(1000)
                    let data = await db.selectPerformance()
                    // Ensure forma integrity
                    expect(data[0]).to.have.property("avg_time")
                    expect(data[0]).to.have.property("average_profit")
                    expect(data[0]).to.have.property("overall_profit")
                    expect(data[0]).to.have.property("number_of_trades")
                    expect(data[0]).to.have.property("sharpe_ratio")
                    expect(data[0]).to.have.property("longest_trade")
                    expect(data[0]).to.have.property("shortest_trade")
                    expect(data[0]).to.have.property("best_trade")
                    expect(data[0]).to.have.property("worst_trade")

                    // Ensure Ciorrectness of calcs
                    expect(data[0].average_profit).to.eql(-0.09)
                    expect(data[0].overall_profit).to.eql(-1.03)
                    expect(data[0].number_of_trades).to.eql(28)
                    expect(data[0].sharpe_ratio).to.eql(-0.33)
                    expect(data[0].avg_time).to.eql(0.5)
                    expect(data[0].longest_trade).to.eql(1)
                    expect(data[0].shortest_trade).to.eql(0)
                    expect(data[0].best_trade).to.eql(0.26)
                    expect(data[0].worst_trade).to.eql(-0.26)
                })
            })
        })

        describe('Stop', async () => {
            let res
            before(async () => {
                res = await chai
                    .request(server)
                    .post('/setstatus?status=Stop')
                    .set('content-type', 'application/json')
                    .send({})
                await sleep(1000)
            })


            it('Call /setstatus with status Stop', async () => {
                expect(res).to.have.status(200)
            })

            it('Call /setstatus with status Stop', async () => {
                expect(res.text).to.eql('{"data":{"botId":"defaultKeys","message":"Status updated to Stop"}}');
            })
        })

        describe('Invalid status', async () => {
            let res
            before(async () => {
                res = await chai
                    .request(server)
                    .post('/setstatus?status=invalidStatus')
                    .set('content-type', 'application/json')
                    .send({})
                await sleep(1000)
            })


            it('Call /setstatus with status Stop', async () => {
                expect(res).to.have.status(550)
            })

            it('Call /setstatus with status Stop', async () => {
                expect(res.text).to.eql('{"response_code":"550","response_message":"Fatal error on status set : ExceptionHandler"}');
            })
        })

        after(async () => {
            await db.TruncateTables()
        })
    })
})
