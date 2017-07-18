var sourceDispatcher = require('dispatcher/SourceDispatcher');
var aggregator = require('aggregator/IntersectionAggregator');
var youtubeTrailer = require('trailer/YoutubeTrailer');
var validator = require('validator/Validator');
var movieHydrator = require('hydrator/Hydrator')
const ValidationError = require('error/ValidationError');
const MovieNotFoundError = require('error/MovieNotFoundError');

var find = function(intentName, slots, sessionAttributes) {
    queryInfo = {
        intentName: intentName,
        slots: slots,
        sessionAttributes: sessionAttributes
    };

    return new Promise(function(resolve, reject) {
        validateSlots(queryInfo)
        .then(() => findMovieFromSources(queryInfo))
        .then((movieLists) => hydrateMovieLists(movieLists))
        .then((movieLists) => processMovieLists(movieLists))
        .then((singleMovieList) => postProcess(singleMovieList))
        .then((singleMovieList) => {
            if (singleMovieList.length == 0 ) {
                reject(new MovieNotFoundError())
                return
            }
            resolve(singleMovieList)
        })
        .catch((err) => {
            reject(err);
        });
    });
}

/**
 * validateSlots will validate all the available slots information and 
 * assume any information in sessionAttribute have been validate
 * If a slot is invalid, it reject and return an error 
 * else if all slot is valid, return the slot and session attributes
 * 
 * @param {*} slots 
 */
function validateSlots(queryInfo) {
    return new Promise(function(resolve, reject){
        validator.validate(queryInfo).then((result) => {
            if (result.isValid) {
                resolve();
            } else {
                reject(new ValidationError(result.incorrectSlotName, result.reason, result.suggestions));
            }
        }).catch((err) => {
            reject(err)
        })
    });
}

/**
 * Finds movies from the sources based on the provided queryInfo
 * @param {*} queryInfo 
 */
function findMovieFromSources(queryInfo) {
    console.log("Finding movie from sources");
    return new Promise(function(resolve, reject) {
        sourceDispatcher.dispatch(queryInfo).then((movies) => {
            console.log("Received movies from sources");
            console.log(movies);
            resolve(movies);
        }).catch((err) => {
            reject(err);
        });
    });
}

function hydrateMovieLists(movieLists) {
    console.log("Hydrating each movie list")
    return new Promise(function(resolve, reject) {
        const promiseList = []
        console.log('overall movielist inside', movieLists)

        movieLists.forEach((movieList) => {
            promiseList.push(movieHydrator.hydrate(movieList))
        })

        console.log("TOTAL PROMISE LIST LENGTH", promiseList.length)

        Promise.all(promiseList).then(hydratedMovieLists => {
            console.log('================')
            console.log("finish hydrating")
            console.log(hydratedMovieLists)
            console.log('================')
            resolve(hydratedMovieLists);
        }).catch((err) => {
            reject(err);
        })
    })
}

function processMovieLists(movieLists) {
    console.log("Processing movie list");
    return new Promise(function(resolve, reject) {
        const movieList = aggregator.aggregate(movieLists);
        console.log("Aggregated movies");
        console.log(movieList);
        resolve(movieList);
    });
}

/**
 * Completes any further processing after aggregated movie list
 * @param {*} movieList 
 */
function postProcess(movieList) {
    console.log("Post processing movie list");

    return new Promise(function(resolve, reject) {

        youtubeTrailer.apply(movieList).then((updatedMovieList) => {
            console.log("Finished finding trailer information");
            resolve(updatedMovieList);
        });

    });
}

module.exports = {
    find : find
}