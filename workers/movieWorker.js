// 'npm install request --save'
var request = require('request');
var fs = require('fs')

var apiKey = process.env.TMDB_API_KEY;
var interval = 1000 //every second
var numberOfMovies = 25000;
var logger = fs.createWriteStream('log.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

var init = 1260;

for (var i = init; i < 25000; i++) {
    
    setTimeout( function (i) {
        var movieId = i;
        var movie = {}
        
        console.log(movieId);

        request('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + apiKey + '&language=en-US', function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            logger.write('calling movie id: ' + movieId + ", got response: " + response.statusCode + "\n"); 

            if (response.statusCode === 200) {
                var data = JSON.parse(response.body);
                movie.title = data.title;
                movie.releaseDate = data.release_date;
                movie.runtime = data.runtime;
                movie.tagline = data.tagline;
                movie.plot = data.overview;
                movie.popularity = data.popularity;

                movie.genres = data.genres.map((g) => { return g.name });

                request('https://api.themoviedb.org/3/movie/' + movieId + '/credits?api_key=' + apiKey, function (error, response, body) {
                    console.log('error:', error); // Print the error if one occurred
                    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    if (response.statusCode === 200) {
                        var actorData = JSON.parse(response.body);
                        var actors = actorData.cast.filter((c) => { return c.order < 20}).map((c) => { return c.name});
                        
                        movie.actors = actors;
                        var director = actorData.crew.find((c) => { return c.job === "Director"});
                        movie.director = director ? director.name : "";

                        // make request here
                        request.post('https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies/movie', { json: movie }, function (elasticError, elasticResponse, body) {
                            console.log('error:', elasticError); // Print the error if one occurred
                            console.log('statusCode:', elasticResponse && elasticResponse.statusCode); // Print the response status code if a response was received
                            //console.log(response.body);
                            logger.write('posted movie: ' + movie.title + ", got response: " + elasticResponse.statusCode + "\n");
                        });

                    }
                    

                });
            }

        });
    }, interval * (i-init), i);
}
