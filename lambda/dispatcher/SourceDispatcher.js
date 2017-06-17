var SlotConstants = require('../model/Slots');
var wikiQuoteSource = require('../source/WikiQuoteSource');
var elasticSource = require('../source/ElasticSource');

/**
 * 
 * @param {*} queryInfo 
 */
var dispatch = function(queryInfo) {
    // create a list of movies. This is to store the movie lists returned from each source.
    // what slots (information) do we know
    const slots = queryInfo['slots'];
    // sessionAttributes can store previous information state i.e. data
    var sessionAttributes = queryInfo['sessionAttributes'];

    const actor = retrieveInfo(SlotConstants.MOVIE_ACTOR, queryInfo);
    const quote = retrieveInfo(SlotConstants.MOVIEQUOTE, queryInfo);
    const plot = retrieveInfo(SlotConstants.MOVIEPLOT, queryInfo);

    var sourcePromises = [];

    return new Promise(function(resolve, reject) {
        if (quote) {
            console.log("WikiQuote source is added");
            sourcePromises.push(wikiQuoteSource.getMovies(quote));
        }

        var body = {
            "query" : {
                "bool" : {
                    "must" : []
                }
            }
        } 

        if (plot) {
            body["query"]["bool"]["must"].push({"match" : {"plot-detailed" : plot}})
        }

        if (actor) {
            body["query"]["bool"]["must"].push({"match" : {"actors" : actor}})
        }
        
        if ( plot || actor ) {
            console.log("Elastic source is called");
            console.log(body)
            sourcePromises.push(elasticSource.getMovies(body));
        }

        // Other sources. Not sure how it will work

        Promise.all(sourcePromises).then(sourceMovies => {
            resolve(sourceMovies);
        }).catch((err) => {
            reject(err);
        });
    });

};

function retrieveInfo(slotName, queryInfo) {
    if (queryInfo.sessionAttributes.hasOwnProperty(slotName)) {
        return queryInfo.sessionAttributes[slotName];
    }

    if (queryInfo.slots.hasOwnProperty(slotName)) {
        queryInfo.sessionAttributes[slotName] = queryInfo.slots[slotName];
        return queryInfo.slots[slotName];
    }

    return null;
}

module.exports = {
    dispatch: dispatch
};