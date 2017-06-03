'use strict';

var rp = require('request-promise');
var tmdbClient = require('tmdbClient');

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

function retrieveMovieListByActor(sessionAttributes, callback) {
    var successHandler = function(parsedBody) {
        var movieList = parsedBody.cast

        if ( movieList.length == 0) {
            callback(close(sessionAttributes, 'Failed',
            { contentType: 'PlainText', content: 'Found the actor/actress but unable to find any movie with actor' }));
        } 

        var msg = { 
            contentType: 'PlainText',
            content: 'I found a movie called ' + movieList[0].title + '\n Was this the movie you were looking for ? You can also filter the result by quote and plot'
        }
        callback(elicitIntent(sessionAttributes, msg))   
    };

    var failHandler = function(err) {
        callback(close(sessionAttributes, 'Failed',
        { contentType: 'PlainText', content: 'Error unable to retrieve the movie list' })); 
    };

    const actorId = sessionAttributes.actorId
    tmdbClient.getMovieListByActor(actorId, successHandler, failHandler);
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

    // validate user input
    if (intentRequest.invocationSource === 'DialogCodeHook') {
        const actorName = slots.Actor;

        if (actorName) {
            var successHandler = function(parsedBody) {
                var resultList = parsedBody.results;

                if (parsedBody.total_results == 1) {
                    // just one actor/actress matching perfect !
                    sessionAttributes.actorId = resultList[0].id;

                    // tell lex actor/actress name is valid
                    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
                } else if (parsedBody.total_results > 1) {
                    // multiple actors and actors return
                    sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'Multiple actors and actress returned, please enter the actor/actress name again')
                } else {
                    // no actors and actress return
                    sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'No actors or actress is returned, , please enter the actor/actress name again')
                } 
            };

            var failHandler = function(err) {
                console.log('Error, with: ' + err.message);
                sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', 'Unable validate this actor')
            };

            tmdbClient.getActor(actorName, successHandler, failHandler);

            return;
        } else {
            // tell lex to ask for actor information
            callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
            return;
        }
    } else {
        // in the case of fulfillment we assume we stored the actorId in sessionAttribute when we validated slot information otherwise return failed fulfillment to user
        if (sessionAttributes.actorId) {
            retrieveMovieListByActor(sessionAttributes, callback)
        } else {
            callback(close(sessionAttributes, 'Failed',
            { contentType: 'PlainText', content: 'Failed to find actor and actress' }));
        }
    }
}

function findMovieByPlot(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    const plotDescription = slots.PlotDescription;

    if (intentRequest.invocationSource === 'DialogCodeHook') { 
        // not sure what to valid so tell lex to go to next step
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
    } else {
        if ('actorId' in sessionAttributes) {
            var successHandler = function(parsedBody) {
                var movieList = parsedBody.cast

                if ( movieList.length == 0) {
                    callback(close(sessionAttributes, 'Failed',
                    { contentType: 'PlainText', content: 'Found the actor/actress but unable to find any movie with actor' }));
                }

                callback(close(sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'I found a movie called ' + movieList[1].title })); 
            }

            var failHandler = function(err) {
                console.log('Error, with: ' + err.message);
                callback(close(sessionAttributes, 'Failed',
                { contentType: 'PlainText', content: 'Error unable to retrieve the movie list' })); 
            }

            tmdbClient.getMovieListByActor(sessionAttributes.actorId, successHandler, failHandler);
        } else {
            var successHandler = function(parsedBody) {
                if (parsedBody.total_results === 0) {
                    callback(close(sessionAttributes, 'Failed',
                    { contentType: 'PlainText', content: 'Unable to find any movie matching the given plot description' }));

                    return;
                }

                sessionAttributes.plotDescription = plotDescription;

                var resultsList = parsedBody.results;
                callback(close(sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'I found a movie called ' + resultsList[0].title }));    
            }

            var failHandler = function(err) {
                console.log('Error, with: ' + err.message);
                callback(close(sessionAttributes, 'Failed',
                { contentType: 'PlainText', content: 'Error unable to retrieve the movie list' })); 
            }

            tmdbClient.searchMovie(plotDescription, successHandler, failHandler)
        }
    }

    return
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
    } else if (intentName === 'FindMovieByPlot') {
        return findMovieByPlot(intentRequest, callback);
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
