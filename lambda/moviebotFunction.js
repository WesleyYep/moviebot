'use strict';

var http = require('http')
var rp = require('request-promise');

 /**
  * This sample demonstrates an implementation of the Lex Code Hook Interface
  * in order to serve a sample bot which manages reservations for hotel rooms and car rentals.
  * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
  * as part of the 'BookTrip' template.
  *
  * For instructions on how to set up and test this bot, as well as additional samples,
  *  visit the Lex Getting Started documentation.
  */

 // --------------- Helpers that build all of the responses -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

function elicitIntent(sessionAttributes, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitIntent',
            message: message,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

function welcome(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    callback(elicitIntent(sessionAttributes, { contentType: 'PlainText', content: 'Welcome to movie bot' }));
    return;
}

function sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, violatedSlot, messageContent) {
    const intentName = intentRequest.currentIntent.name;
    const slots = intentRequest.currentIntent.slots;

    var message = { contentType: 'PlainText', content: messageContent };
    
    slots[`${violatedSlot}`] = null;
    callback(elicitSlot(sessionAttributes, intentName, slots, violatedSlot, message));
    return
}

function findMovieByActor(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    var actorId = null;
    var validationResult = null;

    // validate user input
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        const actorName = slots.Actor;
        const apiKey = process.env.TMDB_KEY;

        if (actorName) {
            var options = {
                uri : 'http://api.themoviedb.org/3/search/person?api_key=' + apiKey + '&query=' + actorName,
                json: true
            }
            //first retrieve the person id
            var validatioResult = null;

            rp(options)
                .then(function(parsedBody) {
                    var resultList = parsedBody.results;

                    if (parsedBody.total_results == 1) {
                        // just one actor/actoress matching perfect !
                        validatioResult = {
                            isValid : true,
                            actorId : resultList[0].id
                        };
                    } else if (parsedBody.total_results > 1) {
                        // multiple actors and actors return
                        sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'Multiple actors and actress returned')
                    } else {
                        // no actors and actress return
                        sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'No actors or actress is returned')
                    }  
                })
                .catch(function (err) {
                    console.log('Error, with: ' + err.message);
                    sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'Unable validate this actor')
                });

            return;
        } else {
            sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'You must provide an actor/actoress name')
            return;
        }
    }

    //const resultList = getMovieListByActor(actorId);

    callback(close(sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: 'Thanks, I have placed your reservation.   Please let me know if you would like to book a car rental, or another hotel.' }));
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'Welcome') {
        return welcome(intentRequest, callback);
    } else if (intentName === 'FindMovieByActor') {
        return findMovieByActor(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    // console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.bot.name=${event.bot.name}`);

        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
