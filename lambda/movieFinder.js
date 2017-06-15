var sourceDispatcher = require('dispatcher/SourceDispatcher');
var aggregator = require('aggregator/IntersectionAggregator');
var validator = require('validator/Validator');

var find = function(intentName, slots, sessionAttributes) {
    queryInfo = {
        intentName: intentName,
        slots: slots,
        sessionAttributes: sessionAttributes
    };

    return new Promise(function(resolve, reject) {
        validateSlots(queryInfo)
        .then(() => findMovieFromSources(queryInfo))
        .then((movieLists) => processMovieLists(movieLists))
        .then((singleMovieList) => {
            if (singleMovieList.length == 0 ) {
                var err = {
                    type: "NotFound"
                }
                
                reject(err)
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
        validator.validate(queryInfo).then((validationResult) => {
            if (validationResult.isValid) {
                resolve();
            } else {
                validationResult["type"] = "Validation";
                reject(validationResult);
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


function processMovieLists(movieLists) {
    console.log("Processing movie list");
    return new Promise(function(resolve, reject) {
        const movieList = aggregator.aggregate(movieLists);
        console.log("Aggregated movies");
        console.log(movieList);
        resolve(movieList);
    });
}

module.exports = {
    find : find
}