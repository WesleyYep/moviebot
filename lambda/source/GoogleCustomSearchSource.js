'use strict';

var rp = require('request-promise');
var AWS = require('aws-sdk')

const tmdbApiKey = process.env.TMDB_KEY;
const googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;

var movieBuilder = require('../model/Movie');

var query = function(queryString) {
    return new Promise((resolve, reject) => {
        const encodeQueryString = "movie about " + encodeURI(queryString);
        var options = {
            uri: 'https://www.googleapis.com/customsearch/v1?key=' + googleApiKey + '&cx=001786123802140316465:3jugr9fs-mq&fields=items(title)&q=' + encodeQueryString,
            json: true,
        };
        rp(options).then(function(res) {
            if (res.items) {
                var movies = res.items.filter((m) => {
           //         console.log(m.name);
                    return m.title.match(/.*\(\d{4}.*/g);
                }).map((m) => {
                    return m.title.split(/\(/g)[0].trim();
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
