'use strict';

var rp = require('request-promise');
var tmdbClient = require('source/tmdbSource');
var wikiQuoteSource = require('source/WikiQuoteSource');
var movieFinder = require('movieFinder');
const ValidationError = require('error/ValidationError');
const MovieNotFoundError = require('error/MovieNotFoundError');

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

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
    if (typeof responseCard === 'undefined') { responseCard = null; }

    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
            responseCard
        },
    };
}

function elicitIntent(sessionAttributes, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitIntent',
            message: message
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
            responseCard
        }
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
                title: movie.getTitle().substring(0, 80),
                subTitle: movie.getTrailerDescription() ? movie.getTrailerDescription().substring(0, 80) : "There is no description for this movie",
                imageUrl: movie.getTrailerThumbnail(),
                attachmentLinkUrl: movie.getTrailerUrl()
            }
        })
    }
}

function suggestionResponseCard(actorNameList, intentName) {
    return {
        contentType: "application/vnd.amazonaws.card.generic",
        genericAttachments: [
            {
                title: intentName === "FindMovieByActor" ? "Actor Suggestion" : "Director Suggestion", 
                subTitle:"Select one of the actor below",
                buttons:  actorNameList.slice(0, 3).map(actorName => {
                    return {
                        text: actorName,
                        value: actorName
                    }
                })        
            }
        ]      
    }
}

function getGoodByeMessage() {
    return {
        contentType : "PlainText",
        content: "No problem, thank you for using the movie bot. Good bye"
    };
}

function getFurtherInfoMessage(sessionAttributes) {
    return {
        contentType : "PlainText",
        content : "What else can you remember about the movie (actor, plot, quote, year, director)" + " " + getFormattedCurrentSessionInfo(sessionAttributes) + 
        ". You can say \"clear current information\" to clear current information"
    };
}

function getClearedInfoMessage(sessionAttributes) {
    return {
        contentType: "PlainText",
        content : "Current information cleared. What can you remember about the movie (actor, plot ,quote, year, director)" + " " + getFormattedCurrentSessionInfo(sessionAttributes)
    }
}

function getHelpMessage() {
    return {
        contentType: "PlainText",
        content: "MovieBot currently supports search by plot, quote, actors, year, and director. You can begin a search by telling MovieBot which search type to execute. e.g. find by actor"
    };
}

function getFormattedCurrentSessionInfo(sessionAttributes) {
    const currentSessionInfo = Object.keys(sessionAttributes).map(k => {
        return k + ": \"" + sessionAttributes[k] + "\""
    }).join(", ");
    return "[Current information => " + currentSessionInfo + "]";
}

function welcome(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};

    var welcomeMsg = {
        contentType: 'PlainText',
        content : 'Hi I\'m moviebot. I find movies that you can\'t remember. Currently we can search by plot, quote, actors, year, and director. Which of these could you remember?'
    }

    callback(elicitIntent(sessionAttributes, welcomeMsg));
    return;
}

function sendInvalidSlotMessage(sessionAttributes, intentRequest, violatedSlot, messageContent, responseCard) {
    const intentName = intentRequest.currentIntent.name;
    const slots = intentRequest.currentIntent.slots;

    var message = { contentType: 'PlainText', content: messageContent };

    slots[`${violatedSlot}`] = null;
    return elicitSlot(sessionAttributes, intentName, slots, violatedSlot, message, responseCard);
}

function findMovie(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;
    const intentName = intentRequest.currentIntent.name;

    if (intentRequest.invocationSource === 'DialogCodeHook') {
        callback(delegate(sessionAttributes, slots))
        return
    }

    movieFinder.find(intentName, slots, sessionAttributes).then((singleMovieList) => {
        //save slot information
        //movieFinder will return a list of movie result
        var msg = {
            contentType: 'PlainText',
            content: 'Hey! We found ' + singleMovieList.length + ' matching movies. The first movie was called ' + singleMovieList[0].title + '. Did we find your movie(yes/no to continue searching)?'
        }

        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, msg, movieToResponseCards(singleMovieList)))
    }).catch((err) => {
        console.log(err)
        if (err instanceof ValidationError) {
            if (intentName === "FindMovieByActor" || intentName === "FindMovieByDirector") {
                var msg = err.reason;
                intentName === "FindMovieByActor" ? msg += ". What is the name of the actor/actress ?" : msg += ". Who is the director?";
                var dialogAction = null;
                if (err.suggestions.length == 0) {
                    dialogAction = sendInvalidSlotMessage(sessionAttributes, intentRequest, err.incorrectSlotName, msg);           
                } else {
                    var responseCard = suggestionResponseCard(err.suggestions, intentName)
                    dialogAction = sendInvalidSlotMessage(sessionAttributes, intentRequest, err.incorrectSlotName, msg, responseCard);
                }
                callback(dialogAction)    
            }
        } else if (err instanceof MovieNotFoundError ) {
            var msg = {
                contentType : "PlainText",
                content : "Couldn't find any movies. " + getFurtherInfoMessage(sessionAttributes).content
            }
            callback(elicitIntent(sessionAttributes, msg))
        } else {
            var msg = {
                contentType : "PlainText",
                content : "Oh no!! something went wrong. " + getFurtherInfoMessage(sessionAttributes).content
            }
            callback(elicitIntent(sessionAttributes, msg))
        }
    });
}

function continueFinding(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    var errMsg = {
        contentType: 'PlainText',
        content: 'Sorry didn\'t understand your response. So did we find your movie (yes/no)'
    }

    if (intentRequest.currentIntent.confirmationStatus === 'Denied') {
        callback(elicitIntent(sessionAttributes, getFurtherInfoMessage(sessionAttributes)))
    } else if (intentRequest.currentIntent.confirmationStatus === 'Confirmed') {
        callback(close({}, 'Fulfilled', getGoodByeMessage()))
    } else {
        callback(confirmIntent(sessionAttributes, 'ContinueFinding', {}, errMsg))
    }
}

function goodbye(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    callback(close({}, 'Fulfilled', getGoodByeMessage()))
}

function unsureResult(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    callback(elicitIntent(sessionAttributes, getFurtherInfoMessage(sessionAttributes)))
}

function help(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes || {};
    const slots = intentRequest.currentIntent.slots;

    callback(elicitIntent(sessionAttributes, getHelpMessage()));
}

function clearCurrentInformation(intentRequest, callback) {
    const sessionAttributes = {}

    callback(elicitIntent(sessionAttributes, getClearedInfoMessage(sessionAttributes)));
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
    } else if (intentName == 'FindMovieByActor' || intentName == 'FindMovieByPlot' || intentName == 'FindMovieByQuote' 
                || intentName == 'FindMovieByDirector' || intentName == 'FindMovieByYear' ) {
        return findMovie(intentRequest, callback);
    } else if (intentName == 'ContinueFinding') {
        return continueFinding(intentRequest, callback);
    } else if (intentName == 'GoodBye') {
        return goodbye(intentRequest, callback);
    } else if (intentName == 'UnsureResult') {
        return unsureResult(intentRequest, callback);
    } else if (intentName == 'Help') {
        return help(intentRequest, callback);
    } else if (intentName == 'ClearCurrentInformation') {
        return clearCurrentInformation(intentRequest, callback);
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
        // preprocess
        console.log(`event.bot.name=${event.bot.name}`);
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
