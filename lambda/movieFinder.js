var sourceDispatcher = require('dispatcher/SourceDispatcher');
var aggregator = require('aggregator/IntersectionAggregator');
var youtubeTrailer = require('trailer/YoutubeTrailer');

var find = function(slots, sessionAttributes) {
    queryInfo = {
        slots: slots,
        sessionAttributes: sessionAttributes
    };

    return new Promise(function(resolve, reject) {
        validateSlots(queryInfo)
        .then(() => findMovieFromSources(queryInfo))
        .then((movieLists) => processMovieLists(movieLists))
        .then((singleMovieList) => postProcess(singleMovieList))
        .then((singleMovieList) => resolve(singleMovieList))
        .catch((err) => {
            reject(err);
        });
    });
}

/**
 * validateSlots will validate all the available slots information and 
 * store any info obtained during the validation step in the session attribute.
 * If a slot is invalid, it reject and return an error 
 * else if all slot is valid, return the slot and session attributes
 * 
 * @param {*} slots 
 */
function validateSlots(queryInfo) {
    return new Promise(function(resolve, reject){
        resolve(queryInfo);
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