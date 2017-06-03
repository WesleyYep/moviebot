const apiKey = process.env.TMDB_KEY;

var rp = require('request-promise');


module.exports = {
    getMovieListByActor : function (actorId, successHandler, failHandler) {
        var uri = 'https://api.themoviedb.org/3/person/' + actorId + '/movie_credits?api_key=' + apiKey;
        getRequest(uri, successHandler, failHandler);
    },

    getActor : function (actorName, successHandler, failHandler) {
        var uri = 'http://api.themoviedb.org/3/search/person?api_key=' + apiKey + '&query=' + actorName;
        getRequest(uri, successHandler, failHandler);
    },

    searchMovie : function (queryString, successHandler, failHandler) {
        var uri = 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + "&query=" + queryString;
        getRequest(uri, successHandler, failHandler);
    }
}

function getRequest(uri, successHandler, failHandler) {
    var options = {
        uri : uri,
        json: true
    }

    rp(options)
        .then(successHandler)
        .catch(failHandler)
}