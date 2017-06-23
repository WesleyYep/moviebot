#!/bin/bash

LEXPATH='lex'
if [ "$1" = "deploy" ]; then #save to hidden .lex folder to use for deployment checksums
    cp -r lex .lex
    LEXPATH=".lex"  
    echo "going to save lex to hidden folder for checksums"    
fi

echo saving lex
aws lex-models get-bot --name MovieBot --version-or-alias "\$LATEST" > $LEXPATH/MovieBot.json
# get intents
node > $LEXPATH/intents/intents.txt <<EOF
var data = require('./$LEXPATH/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF
intents=($(awk -F= '{print $1}' $LEXPATH/intents/intents.txt))
#    readarray -t intents < $LEXPATH/intents/intents.txt
for intentName in "${intents[@]}"
do
    :
    intentName=$(tr -dc '[[:print:]]' <<< "$intentName") # remove non-printed chars
    aws lex-models get-intent --name $intentName --intent-version "\$LATEST" > $LEXPATH/intents/$intentName.json
done

## get slots
aws lex-models get-slot-types > $LEXPATH/slots/.slots_temp.json
# filter ones that have description = moviebot
node > $LEXPATH/slots/slots.txt <<EOF
var data = require('./$LEXPATH/slots/.slots_temp.json');
data = data.slotTypes.filter((s) => { return s.description.startsWith("moviebot"); }).forEach((s) => {
console.log(s.name);
});
EOF
rm $LEXPATH/slots/.slots_temp.json

# save each slot
slots=($(awk -F= '{print $1}' $LEXPATH/slots/slots.txt))
#   readarray -t slots < $LEXPATH/slots/slots.txt
for slotName in "${slots[@]}"
do
    :
    slotName=$(tr -dc '[[:print:]]' <<< "$slotName") # remove non-printed chars
    aws lex-models get-slot-type --name $slotName --slot-type-version "\$LATEST" > $LEXPATH/slots/$slotName.json
done

## DEPLOY ##
if [ "$1" = "deploy" ]; then
    name=MovieBot

    # Find bot to update
    node > lex/out_MovieBot.json <<EOF
var data = require('./lex/${name}.json');
var myBotData = require('./.lex/${name}.json');
delete data.status; 
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
data.checksum = myBotData.checksum;
data['processBehavior'] = "BUILD";
data['name'] = '${name}';
if (data.intents) {
    data.intents.forEach((i) => {
        i.intentVersion = "\$LATEST";
    })
}
console.log(JSON.stringify(data));
EOF

    # find intents to update
    node > lex/intents/intents.txt <<EOF
var data = require('./lex/MovieBot.json');
var names = data.intents.map((i) => { return i.intentName; })
console.log(names.join("\r\n"));
EOF

    # update slots
    slots=($(awk -F= '{print $1}' lex/slots/slots.txt))
    for slotName in "${slots[@]}"
    do
        : 
        slotName=$(tr -dc '[[:print:]]' <<< "$slotName") # remove non-printed chars        
        node > lex/slots/out_tempSlot.json <<EOF
var data = require('./lex/slots/${slotName}.json');
var mySlotData = require('./.lex/slots/${slotName}.json');
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
data.checksum = mySlotData.checksum;
console.log(JSON.stringify(data));
EOF
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
var myIntentData = require('./.lex/intents/${intentName}.json');
delete data.createdDate;
delete data.version;
delete data.lastUpdatedDate;
data.checksum = myIntentData.checksum;
if (data.slots) {
    data.slots.filter((s) => {
        return !s.slotType.startsWith("AMAZON");
    }).forEach((s) => {
        s.slotTypeVersion = "\$LATEST";
    })
}
if (data.fulfillmentActivity.type === "CodeHook") {
    data.fulfillmentActivity.codeHook.uri = myIntentData.fulfillmentActivity.codeHook.uri;
}
if (data.dialogCodeHook) {
    data.dialogCodeHook.uri = myIntentData.fulfillmentActivity.codeHook.uri;
}
console.log(JSON.stringify(data));
EOF
        echo updating intent $intentName
        aws lex-models put-intent --name $intentName --cli-input-json file://lex/intents/out_tempIntent.json
    done

    # update bot
    echo updating MovieBot
    aws lex-models put-bot --cli-input-json file://lex/out_MovieBot.json

fi

echo ======== PLEASE ENSURE NEW SLOTS HAVE DESCRIPTION=moviebot ========
echo done!