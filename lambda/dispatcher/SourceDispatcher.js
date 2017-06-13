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
            // if (sessionAttributes.hasOwnProperty('MovieQuote')) {
            //     // something like getting previous results from session attributes or could be from dynamodb
            //     const wikiQuoteMovies = sessionAttributes['MovieQuote'];
            //     movies.push(wikiQuoteMovies);
            // } else {
            //     const quote = slots[SlotConstants.MOVIEQUOTE];
            //     wikiQuoteSource.getMovies(quote).then((wikiQuoteMovies) => {
            //         movies.push(wikiQuoteMovies);
            //         // TODO need to find way to store it in session attributes. won't work adding in a list..
            //         sessionAttributes['MovieQuote'] = wikiQuoteMovies;
            //     }).catch((err) => {
            //         reject(err);
            //     });
            // }
        } else if (plot && actor) {
            console.log("Elastic source is called for actor and plot");
            sourcePromises.push(elasticSource.getMoviesByActorPlot(actor, plot))
        } else if (plot) {
            console.log("Elastic source is called");
            sourcePromises.push(elasticSource.getMoviesByPlot(plot));
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
    if (queryInfo.slots.hasOwnProperty(slotName)) {
        return queryInfo.slots[slotName];
    }

    if (queryInfo.sessionAttributes.hasOwnProperty(slotName)) {
        return queryInfo.sessionAttributes[slotName];
    }

    return null;
}

module.exports = {
    dispatch: dispatch
};