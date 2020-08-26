#!/bin/bash

#creating .env file
touch ./src/.env
echo > ./src/.env

#getting current path
CURRENT_PATH="$PWD"
echo 'CURRENT_PATH='$CURRENT_PATH > ./src/.env
echo 'BOTSPORT=3000' >> ./src/.env
echo 'BOTNAME=defaultKeys' >> ./src/.env
echo 'PORT=3009' >> ./src/.env
echo 'PAIR=1mXBTUSD,5mXBTUSD' >> ./src/.env
echo 'API_KEY_ID='$API_KEY_ID >> ./src/.env
echo 'API_KEY_SECRET='$API_KEY_SECRET >> ./src/.env

mkdir ./src/api/strategies
touch ./src/strategies/defaultKeys.js
echo > ./src/strategies/defaultKeys.js

echo 'const strategy = async (params) => {
    const strategyObject = {
        execute: false						// Identifies whether we will be making an order
        , side: "Buy"						// Buy v. sell 
        , orderQty: "10"				    // Amount of contracts
        , price: "755"						// Price at which to buy
        , orderType: "Limit"				// Always limit
        , timeInForce: "GoodTillCancel"		// Always goodTillCancelled
        , timestamp: null
        , leverage: "1"					    // Identifies leverage used for the order
    }

    if (params[params.length - 1].open >= 777) {
        strategyObject.execute = true
        strategyObject.price = params[params.length - 1].open
        strategyObject.side = "Sell"
        strategyObject.timestamp = params[params.length - 1].timestamp
    }
    if (params[params.length - 1].open < 777) {
        strategyObject.execute = true
        strategyObject.price = params[params.length - 1].open
        strategyObject.timestamp = params[params.length - 1].timestamp
    }
    return strategyObject
    }
    module.exports = { strategy }' >> ./src/api/strategies/defaultKeys.js