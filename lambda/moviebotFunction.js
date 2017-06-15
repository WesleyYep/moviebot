'use strict';

var rp = require('request-promise');
var tmdbClient = require('source/tmdbSource');
var wikiQuoteSource = require('source/WikiQuoteSource');
var movieFinder = require('movieFinder');

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

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
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

function close(sessionAttributes, fulfillmentState, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
            responseCard
        }
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

function movieToResponseCards(movieList) {
    return {
        contentType: "application/vnd.amazonaws.card.generic",
        genericAttachments: movieList.slice(0, 10).map(movie => {
            return {
                title: movie.getTitle(),
                imageUrl: "https://images-na.ssl-images-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_UY1200_CR90,0,630,1200_AL_.jpg"
            }
        })
    }
}

function welcome(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var welcomeMsg = {
        contentType: 'PlainText',
        content : 'Hi I\'m moviebot. I find movies that you can\'t remember. What can you remember about a particular movie?'
    }

    callback(elicitIntent(sessionAttributes, welcomeMsg));
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

function findMovie(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    const intentName = intentRequest.currentIntent.name

    if (intentRequest.invocationSource === 'DialogCodeHook') {
        callback(delegate(sessionAttributes, slots))
        return
    }

    movieFinder.find(intentName, slots, sessionAttributes).then((singleMovieList) => {
        //save slot information
        //movieFinder will return a list of movie result
        var msg = {
            contentType: 'PlainText',
            content: 'Hey! We found ' + singleMovieList.length + ' matching movies. The first movie was called ' + singleMovieList[0].title + '. Did we find your movie? Or still unsure ?'
        }

        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(singleMovieList)))
    }).catch((err) => {
        console.log(err)
        if (err.type === "Validation") {
            if (intentName === "FindMovieByActor") {
                sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, err.incorrectSlotName, err.reason + ". What is the name of the actor/actress ?");
            }
        } else if (err.type == "NotFound" ) {
            var msg = {
                contentType : "PlainText",
                content : "Hmm couldn't find any movies, Can you remember any more information?"
            }
            callback(elicitIntent(sessionAttributes, msg))
        } else {
            var msg = {
                contentType : "PlainText",
                content : "Oh no!! something went wrong. What information did you have about the movies?"
            }
            callback(elicitIntent(sessionAttributes, msg))
        }
    });
}

function continueFinding(intentRequest, callback) {
    console.log(intentRequest);

    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    var msg = {
        contentType : "PlainText",
        content : "Can you remember any more information?"
    }

    var goodByeMsg = {
        contentType : "PlainText",
        content: "Thank you for using the movie bot. Good bye"
    }

    var errMsg = {
        contentType: 'PlainText',
        content: 'Sorry didn\'t understand your response. So did we find your movie (yes/no)'
    }
 
    if (intentRequest.currentIntent.confirmationStatus === 'Denied') {
        callback(elicitIntent(sessionAttributes, msg))
    } else if (intentRequest.currentIntent.confirmationStatus === 'Confirmed') {
        callback(close({}, 'Fulfilled', goodByeMsg))
    } else {
        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, errMsg))
    }
}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    console.log(intentRequest);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'Welcome') {
        return welcome(intentRequest, callback);
    } else if (intentName == 'FindMovie') {
        return findMovie(intentRequest, callback);
    } else if (intentName == 'FindMovieByActor' || intentName == 'FindMovieByPlot' || intentName == 'FindMovieByQuote') {
        return findMovie(intentRequest, callback);
    } else if (intentName == 'ContinueFinding') {
        return continueFinding(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    console.log(JSON.stringify(response, null, 2));
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
