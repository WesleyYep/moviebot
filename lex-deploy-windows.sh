#!/bin/bash

if [ "$1" = "prod" ]; then
    echo deploying lex to prod
    aws lex-models get-bot --name MovieBotProd --version-or-alias "\$LATEST" > lex/MovieBotProd.json # Always get from dev    
    name=MovieBotProd
else
    echo deploying lex to dev
    name=MovieBot
fi

if [ "$2" != "init" ]; then
    echo running lex get script....
    aws lex-models get-bot --name MovieBot --version-or-alias "\$LATEST" > lex/MovieBot.json # Always get from dev
fi

echo running lex deploy script....

node > lex/out_MovieBot.json <<EOF
var data = require('./lex/MovieBot.json');
var dataProd = require('./lex/MovieBotProd.json');
delete data.status;
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
if ('${1}' === 'prod') {
    data.checksum = dataProd.checksum;
}
if ('${2}' === 'init') {
    delete data.checksum;
}
data['processBehavior'] = "BUILD";
data['name'] = '${name}';
console.log(JSON.stringify(data));
EOF

aws lex-models put-bot --cli-input-json file://lex/out_MovieBot.json

echo done!