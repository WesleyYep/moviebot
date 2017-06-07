var find = function(slots, sessionAttributes) {
    queryInfo = {
        slots : slots,
        sessionAttributes: sessionAttributes
    };

    return new Promise(function(resolve, reject) {
        validateSlots(queryInfo)
        .then(findMovieFromSources(queryInfo))
        .then(procesMovieList(movieLists))
        .then((singleMovieList) => {
            resolve(singleMovieList);
        })
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

    });
}

function findMovieFromSources(queryInfo) {
    return new Promise(function(resolve, reject) {

    });
}


function processMovieLists(movieLists) {
    return new Promise(function(resolve, reject){

    });
}

modules.exports = {
    find : find
}