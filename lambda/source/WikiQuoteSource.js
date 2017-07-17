'use strict';

var rp = require('request-promise');
var movieBuilder = require('../model/Movie');

const fuzzyLimit = 100;
const results = 250;

/**
 * Removes any film stop words in title if there is any. i.e. (film), (1999 film).
 * Otherwise it returns the original string
 * @param {*} title 
 */
var removeFilmStopWords = function(title) {
    var re = /.*(?=\s\((.*\s)?[f|F]ilm\))/;
    var result = title.match(re);
    if (result) {
        return result[0];
    }
    return title;
};

// This returns a promise. Async operation.
var getMovies = function(quote) {
    const apiKey = process.env.WIKIQUOTE_KEY;

    // encode the quote
    var encodeQuote = encodeURI(quote);

    // perform exact phrase search with fuzzy limit. provides finer search results.
    var options = {
        uri: 'https://en.wikiquote.org/w/api.php?action=query&format=json&list=search&srsearch="' + encodeQuote + '"~' + fuzzyLimit + '~&srprop=redirecttitle&srlimit=' + results,
        json: true
    };

    return new Promise((resolve, reject) => {
        rp(options)
            .then(function(res) {
                // extract results
                const results = res.query.search;

                const movies = results.map(function(movie) {
                    const title = removeFilmStopWords(movie.title);
                    return movieBuilder.builder(title).build();
                });

                resolve(movies);
            }).catch(function(err) {
                reject(err);
            });
    });
};

module.exports = {
    getMovies: getMovies,
    removeFilmStopWords: removeFilmStopWords
};