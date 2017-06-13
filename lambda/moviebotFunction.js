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

function retrieveMovieListByActor(sessionAttributes, callback) {

    const actorId = sessionAttributes.actorId;

    tmdbClient.getMovieListByActor(actorId).then(function(val) {
        var msg = {
            contentType: 'PlainText',
            content: 'I found a movie called ' + val[0].getTitle() + ' Do you want to keep looking ?'
        };

        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(val)))
    }).catch(function(err) {
        callback(close(sessionAttributes, 'Failed', {
            contentType: 'PlainText',
            content: err
        }))
    });

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

            tmdbClient.getActor(actorName)
                .then(function(val) {
                    // update session attributes actorId
                    sessionAttributes.actorId = val;
                    callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
                }).catch(function(err) {
                    sendInvalidSlotMessage(sessionAttributes, intentRequest, callback, 'Actor', err);
                });

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
            tmdbClient.getMovieListByActor(sessionAttributes.actorId).then(function(val) {
                const firstMovieTitle = val[1].getTitle();

                var msg = {
                    contentType: 'PlainText',
                    content: 'I found a movie called ' + firstMovieTitle + '. Do you want to keep looking ?'
                }

                callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(val)))
            }).catch(function(err) {
                callback(close(sessionAttributes, 'Failed', {
                    contentType: 'PlainText',
                    content: err
                }))
            });
        } else {
            tmdbClient.searchMovie(plotDescription).then(function(val) {
                sessionAttributes.plotDescription = plotDescription;
                const movieTitle = val[0].getTitle();

                var msg = {
                    contentType: 'PlainText',
                    content: 'I found a movie called ' + movieTitle  + '. Do you want to keep looking ?'
                }

                callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(val)))
            }).catch(function(err) {
                callback(close(sessionAttributes, 'Failed', {
                    contentType: 'PlainText',
                    content: err
                }))
            });
        }
    }

    return;
}

function findMovieByQuote(intentRequest, callback) {
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

function findMovie(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    movieFinder.find(slots, sessionAttributes).then((singleMovieList) => {
        //movieFinder will return a list of movie result
        var msg = {
            contentType: 'PlainText',
            content: 'There are ' + singleMovieList.length + ' matching movies' + '. Do you want to keep looking ?'
        }

        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(singleMovieList)))
    }).catch((err) => {
        //error object structure
        if (err.type === "Validation") {

        } else if (err.type == "NotFound" ) {

        } else {

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
        content: 'Sorry didn\'t understand your response. Do you want to keep looking ? (yes/no)'
    }
 
    if (intentRequest.currentIntent.confirmationStatus === 'Confirmed') {
        callback(elicitIntent(sessionAttributes, msg))
    } else if (intentRequest.currentIntent.confirmationStatus === 'Denied') {
        callback(close(sessionAttributes, 'Fulfilled', goodByeMsg))
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
    } else if (intentName == 'FindMovieByActor') {
        return findMovieByActor(intentRequest, callback);
    } else if (intentName == 'FindMovieByPlot') {
        return findMovieByPlot(intentRequest, callback); 
    } else if (intentName == 'ContinueFinding') {
        return continueFinding(intentRequest, callback);
    } else if (intentName == 'FindMovieByQuote') {
        return findMovie(intentRequest, callback);
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
