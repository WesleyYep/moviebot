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

    var sourcePromises = [];

    return new Promise(function(resolve, reject) {
        if (slots.hasOwnProperty(SlotConstants.MOVIEQUOTE)) {
            console.log("WikiQuote source is added");
            const quote = slots[SlotConstants.MOVIEQUOTE];
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
        } else if (slots.hasOwnProperty(SlotConstants.MOVIEPLOT)) {
            console.log("Elastic source is called");
            const plot = slots[SlotConstants.MOVIEPLOT];
            sourcePromises.push(elasticSource.getMovies(plot));

            
        }

        // Other sources. Not sure how it will work

        Promise.all(sourcePromises).then(sourceMovies => {
            resolve(sourceMovies);
        }).catch((err) => {
            reject(err);
        });
    });

};

module.exports = {
    dispatch: dispatch
};