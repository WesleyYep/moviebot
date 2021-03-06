var elasticSource = require('../source/ElasticSource');
var moment = require('moment');

var hydrate = function(movieList) {
    console.log('hydrating', movieList)
    return new Promise(function(resolve, reject) {
        const promiseList = []
        for (index = 0; index < movieList.length; index++) {
            promiseList.push(hydrateMovieFromES(movieList[index]))
        }

        Promise.all(promiseList).then(sourceMovies => {
            resolve(sourceMovies);
        }).catch((err) => {
            reject(err);
        })
    })
}

function hydrateMovieFromES(movie) {
    return new Promise(function(resolve, reject) {
        //first check if the movie object is hydrated already
        const director = movie.getDirector()
        const releaseDate = movie.getReleaseDate()
        const trailerURL = movie.getTrailerUrl()
        const genre = movie.getGenre()

        if (!isUndefined(director) && !isUndefined(releaseDate) && !isUndefined(genre) && !isUndefined(trailerURL)) {
            //movie object have most of the information return it as it is
            resolve(movie)
            return
        }

        //at the moment let use title to match
        var searchBody = {
            "query" : {
                "bool" : {
                    "must" : {
                        "match_phrase" : {
                            "title" : movie.getTitle()
                        }
                    }
                }
            },
            "sort": [
                { "popularity": "desc"}
            ]
        }

        elasticSource.getMovies(searchBody).then((resultMovieList) => {
            for (index = 0; index <resultMovieList.length; index++) {
                var currentMovie = resultMovieList[index]

                if (currentMovie.getTitle() !== movie.getTitle()) {
                    continue
                }

                if (isUndefined(releaseDate)) {
                    movie.setReleaseDate(currentMovie.getReleaseDate())
                } else {
                    if (!moment(movie.getReleaseDate()).isSame(currentMovie.getReleaseDate, "year")) {
                        //different release year means that its a different movies with the same title so continue
                        continue
                    }
                }

                //do not override existing information
                if (isUndefined(director)) {
                    movie.setDirector(currentMovie.getDirector())
                }

                if (isUndefined(genre)) {
                    movie.setGenre(currentMovie.getGenre())
                }

                if (isUndefined(trailerURL)) {
                    movie.setTrailerUrl(currentMovie.getTrailerUrl())
                    movie.setTrailerThumbnail(currentMovie.getTrailerThumbnail())
                }

                break;
            }

            resolve(movie)
        }).catch((err) => {
            reject(err)
        })
    })
}

function isUndefined(field) {
    return typeof field === 'undefined'
}

module.exports = {
    hydrate: hydrate
}
