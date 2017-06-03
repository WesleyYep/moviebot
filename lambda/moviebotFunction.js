'use strict';

var wikiQuoteSource = require('WikiQuoteSource');

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
    // const slots = intentRequest.currentIntent.slots;
    // const pickUpCity = slots.PickUpCity;
//    const confirmationStatus = intentRequest.currentIntent.confirmationStatus;
    const sessionAttributes = intentRequest.sessionAttributes || {};
    callback(elicitIntent(sessionAttributes, { contentType: 'PlainText', content: 'Welcome to movie bot' }));
    return;
}

function findMovie(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    // retrieve slots
    const quote = intentRequest.currentIntent.slots.MovieQuote;

    // Should be aggregating the source results
    wikiQuoteSource.getMovies(quote).then((val) => {

        if (val.length > 0) {
            callback(close(sessionAttributes, 'Fulfilled', {
                contentType: 'PlainText',
                content: 'I found a movie matching the quote called ' + val[0].getTitle()
            }));
        } else {
            callback(close(sessionAttributes, 'Failed', {
                contentType: 'PlainText',
                content: 'Could not find a movie matching the quote'
            }));
        }

    }).catch((reason) => {
        callback(close(sessionAttributes, 'Failed', {
            contentType: 'PlainText',
            content: reason
        }));
    });

    return;
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
    } else if (intentName == 'FindMovie') {
        return findMovie(intentRequest, callback);
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
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name, alias and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired source.
         */
        /*
        if (event.bot.name != 'BookTrip') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
