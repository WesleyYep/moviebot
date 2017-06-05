'use strict';

const apiKey = process.env.TMDB_KEY;

var rp = require('request-promise');
var movieBuilder = require('../model/Movie');

var getMovieListByActor = function(actorId) {
    var options = {
        uri: 'https://api.themoviedb.org/3/person/' + actorId + '/movie_credits?api_key=' + apiKey,
        json: true
    };

    return new Promise(function(resolve, reject) {
        rp(options)
            .then(function(res) {
                const movieList = res.cast;

                if (movieList.length == 0) {
                    reject('Found the actor/actress but unable to find any movie with actor');
                } 

                const movies = movieList.map(function(movie) {
                    const title = movie.title;
                    return movieBuilder.builder(title).build();
                });

                resolve(movies);
            })
            .catch(function(err) {
                reject('Error unable to retrieve the movie list');
            });
    });
};

var getActor = function(actorName) {
    const encodeActorName = encodeURI(actorName);

    var options = {
        uri: 'http://api.themoviedb.org/3/search/person?api_key=' + apiKey + '&query=' + encodeActorName,
        json: true
    };
    
    return new Promise(function(resolve, reject) {
        rp(options)
            .then(function(res) {

                if (res.total_results == 1) {
                    const resultList = res.results;
                    
                    // just one actor/actress matching perfect !
                    const actorId = resultList[0].id;

                    // tell lex actor/actress name is valid
                    resolve(actorId);
                } else if (res.total_results > 1) {
                    // multiple actors and actors return
                    reject('Multiple actors and actress returned, please enter the actor/actress name again');
                } else {
                    // no actors and actress return
                    reject('No actors or actress is returned, , please enter the actor/actress name again');
                }

            })
            .catch(function(err) {
                reject('Unable validate this actor');
            });
    });
};


var searchMovie = function(queryString) {
    const encodeQueryString = encodeURI(queryString);

    var options = {
        uri: 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + "&query=" + encodeQueryString,
        json: true
    };

    return new Promise(function(resolve, reject) {
        rp(options)
            .then(function(res) {
                if (res.total_results === 0) {
                    reject('Unable to find any movie matching the given plot description');
                }

                const resultsList = res.results;

                const movies = resultsList.map(function(movie) {
                    const title = movie.title;
                    return movieBuilder.builder(title).build();
                });

                resolve(movies);
            })
            .catch(function(err) {
                reject('Error unable to retrieve the movie list');
            });
    });
};

module.exports = {
    getMovieListByActor : getMovieListByActor,

    getActor : getActor,

    searchMovie : searchMovie
}