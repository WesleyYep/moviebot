#!/bin/bash

if [ "$1" = "save" ]; then # save or deploy
    if [ "$2" = "prod" ]; then 
        echo saving lex prod
        aws lex-models get-bot --name MovieBotProd --version-or-alias "\$LATEST" > lex/MovieBotProd.json
    else
        echo saving lex dev
        aws lex-models get-bot --name MovieBot --version-or-alias "\$LATEST" > lex/MovieBot.json
    fi
    # get intents
    node > lex/intents.txt <<EOF
var data = require('./lex/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF
    readarray -t intents < lex/intents.txt
    for intentName in "${intents[@]}"
    do
        :
        intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars
        aws lex-models get-intent --name $intentName --intent-version "\$LATEST" > lex/$intentName.json
    done
elif [ "$1" = "deploy" ]; then
    if [ "$2" = "prod" ]; then 
        echo deploying lex prod
        name=MovieBotProd
    else
        echo deploying lex dev
        name=MovieBot
    fi

    node > lex/out_MovieBot.json <<EOF
var data = require('./lex/${name}.json');
delete data.status;
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
data['processBehavior'] = "BUILD";
data['name'] = '${name}';
console.log(JSON.stringify(data));
EOF

    # put intents
    node > intents.txt <<EOF
var data = require('./lex/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF

    readarray -t intents < lex/intents.txt
    for intentName in "${intents[@]}"
    do
        : 
        intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars        
        node > lex/out_tempIntent.json <<EOF
var data = require('./lex/${intentName}.json');
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
console.log(JSON.stringify(data));
EOF
        aws lex-models put-intent --name $intentName --cli-input-json file://lex/out_tempIntent.json

    done


    aws lex-models put-bot --cli-input-json file://lex/out_MovieBot.json

fi

echo done!