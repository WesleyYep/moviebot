#!/bin/bash

## SAVE ##
if [ "$1" = "save" ]; then # save or deploy
    echo saving lex
    aws lex-models get-bot --name MovieBot --version-or-alias "\$LATEST" > lex/MovieBot.json
    # get intents
    node > lex/intents/intents.txt <<EOF
var data = require('./lex/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF
    intents=($(awk -F= '{print $1}' lex/intents/intents.txt))
#    readarray -t intents < lex/intents/intents.txt
    for intentName in "${intents[@]}"
    do
        :
        intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars
        aws lex-models get-intent --name $intentName --intent-version "\$LATEST" > lex/intents/$intentName.json
    done

    ## get slots
    aws lex-models get-slot-types > lex/slots/.slots_temp.json
    # filter ones that have description = moviebot
    node > lex/slots/slots.txt <<EOF
var data = require('./lex/slots/.slots_temp.json');
data = data.slotTypes.filter((s) => { return s.description.startsWith("moviebot"); }).forEach((s) => {
    console.log(s.name);
});
EOF
    rm lex/slots/.slots_temp.json

    # save each slot
    slots=($(awk -F= '{print $1}' lex/slots/slots.txt))
 #   readarray -t slots < lex/slots/slots.txt
    for slotName in "${slots[@]}"
    do
        :
        slotName=$(tr -dc '[[:print:]]' <<< "$slotName") # remove non-printed chars
        aws lex-models get-slot-type --name $slotName --slot-type-version "\$LATEST" > lex/slots/$slotName.json
    done

## DEPLOY ##
elif [ "$1" = "deploy" ]; then
    # get link to lambda
    echo "checking for lambda function moviebotFunction..."
    aws lambda get-function --function-name moviebotFunction > lambda/.temp_moviebotFunction.json

    name=MovieBot

    # Find bot to update
    node > lex/out_MovieBot.json <<EOF
var data = require('./lex/${name}.json');
delete data.status; 
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
delete data.checksum;
data['processBehavior'] = "BUILD";
data['name'] = '${name}';
if (data.intents) {
    data.intents.forEach((i) => {
        i.intentVersion = "\$LATEST";
    })
}
console.log(JSON.stringify(data));
EOF
    # delete existing bot
    echo deleting existing $name
    aws lex-models delete-bot --name $name

    # find intents to update
    node > lex/intents/intents.txt <<EOF
var data = require('./lex/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF

    # delete intents
#    readarray -t intents < lex/intents/intents.txt
    intents=($(awk -F= '{print $1}' lex/intents/intents.txt))

    for intentName in "${intents[@]}"
    do
        : 
        intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars        
        echo deleting intent $intentName
        aws lex-models delete-intent --name $intentName
    done

    # delete and update slots
#    readarray -t slots < lex/slots/slots.txt
    slots=($(awk -F= '{print $1}' lex/slots/slots.txt))
    for slotName in "${slots[@]}"
    do
        : 
        slotName=$(tr -dc '[[:print:]]' <<< "$slotName") # remove non-printed chars        
        node > lex/slots/out_tempSlot.json <<EOF
var data = require('./lex/slots/${slotName}.json');
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
delete data.checksum;
console.log(JSON.stringify(data));
EOF
        echo deleting slot $slotName
        aws lex-models delete-slot-type --name $slotName
        echo updating slot $slotName
        aws lex-models put-slot-type --name $slotName --cli-input-json file://lex/slots/out_tempSlot.json

    done

    # update intents

    #readarray -t intents < lex/intents/intents.txt
    intents=($(awk -F= '{print $1}' lex/intents/intents.txt))

    for intentName in "${intents[@]}"
    do
        : 
        intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars        
        node > lex/intents/out_tempIntent.json <<EOF
var data = require('./lex/intents/${intentName}.json');
var lambdaData = require('./lambda/.temp_moviebotFunction.json');
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
delete data.checksum;
if (data.slots) {
    data.slots.filter((s) => {
        return !s.slotType.startsWith("AMAZON");
    }).forEach((s) => {
        s.slotTypeVersion = "\$LATEST";
    })
}
if (data.fulfillmentActivity.type === "CodeHook") {
    data.fulfillmentActivity.codeHook.uri = lambdaData.Configuration.FunctionArn;
}
if (data.dialogCodeHook) {
    data.dialogCodeHook.uri = lambdaData.Configuration.FunctionArn;
}
console.log(JSON.stringify(data));
EOF
        echo updating intent $intentName
        aws lex-models put-intent --name $intentName --cli-input-json file://lex/intents/out_tempIntent.json
    done

    rm ./lambda/.temp_moviebotFunction.json

    # update bot
    echo updating MovieBot
    aws lex-models put-bot --cli-input-json file://lex/out_MovieBot.json

fi




# TODO - delete removed slots/intents from json folder


echo done!