'use strict';

var rp = require('request-promise');
var movieBuilder = require('Movie');

// This returns a promise. Async operation.
var getMovies = function(quote) {
    const apiKey = process.env.WIKIQUOTE_KEY;

    // encode the quote
    var encodeQuote = encodeURI(quote);

    var options = {
        uri: 'https://en.wikiquote.org/w/api.php?action=query&format=json&list=search&srsearch=' + encodeQuote + '&srprop=redirecttitle',
        json: true
    };

    return new Promise((resolve, reject) => {
        rp(options)
            .then(function(res) {
                // extract results
                const results = res.query.search;

                const movies = results.map(function(movie) {
                    const title = movie.title;
                    return movieBuilder.builder(title).build();
                });

                resolve(movies);
            }).catch(function(err) {
                reject(err);
            });
    });
};

module.exports = {
    getMovies: getMovies
};