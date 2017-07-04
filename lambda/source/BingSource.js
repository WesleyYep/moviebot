'use strict';

var rp = require('request-promise');
var AWS = require('aws-sdk')

const tmdbApiKey = process.env.TMDB_KEY;
const bingApiKey = process.env.BING_KEY;

var movieBuilder = require('../model/Movie');

var query = function(queryString) {
    return new Promise((resolve, reject) => {
        const encodeQueryString = "movie about " + encodeURI(queryString);
        var options = {
            uri: 'https://api.cognitive.microsoft.com/bing/v5.0/search?count=50&responseFilter=webpages&mkt=en-us&q=' + encodeQueryString,
            json: true,
            headers: {
                'Ocp-Apim-Subscription-Key': bingApiKey
            },
        };
        rp(options).then(function(res) {
            if (res.webPages && res.webPages.value) {
                var movies = res.webPages.value.filter((m) => {
           //         console.log(m.name);
                    return m.name.match(/.*(\(\d{4}|\(film).*/g);
                }).map((m) => {
                    return m.name.split(/\(| - /g)[0].trim();
                }).filter(function(item, pos, self) {
                    return self.indexOf(item) == pos; //make unique
                });
                resolve(movies);
            }
        })
        .catch(function(err) {
            console.log('Error unable to retrieve the movie list');
            reject(err);
        });
    });
};

var tmdbSearchQuery = function(title) {
    var options = {
        uri: 'https://api.themoviedb.org/3/search/movie?api_key=' + tmdbApiKey + "&language=en-US&query=" + title,
        json: true
    };
    return new Promise(function(resolve, reject) {
        rp(options)
            .then(function(res) {
                const movieList = res.results;
                if (movieList.length > 0) {
                    console.log(movieList[0].title);
                    resolve(movieList[0].title);
                } else {
                    resolve();
                }
            }).catch(function(err) {
                reject(err);
            });
    });
};

var getMovies = function(plot) {
    return new Promise(function(resolve, reject) {
        query(plot).then((movies) => {
            console.log(movies);
            var tmdbPromises = [];
            movies.forEach((m) => {
                tmdbPromises.push(tmdbSearchQuery(m))
            });

            Promise.all(tmdbPromises).then(responseBody => {
                var movies = responseBody.filter((item, index, self) => self.indexOf(item) == index && item) // filter resulting movies
                console.log(movies);
                movies = movies.map(function(title) {
                    return movieBuilder.builder(title).build();
                });
                resolve(movies);
            }).catch((err) => {
                reject(err);
            });

        }).catch((err) => {
            console.log('Error: ' + err);
            reject(err)
        });
    });
};

module.exports = {
    getMovies : getMovies
}
