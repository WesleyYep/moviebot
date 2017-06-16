// 'npm install request --save'
var request = require('request');
var fs = require('fs')

var apiKey = process.env.TMDB_API_KEY;
var interval = 500 //every 0.5 seconds per i
var logger = fs.createWriteStream('output_update.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

var DEBUG = true;
var max = 470000;
var size = 1;
var init = 0;

for (var i = init; i <= max; i+=size) {
    
    setTimeout( function (i) {
        var movieId = i;
        if (DEBUG) { console.log(movieId); }
        var movie = {}

        request('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + apiKey + '&language=en-US', function (error, response, body) {
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
                    if (response.statusCode === 200) {
                        var actorData = JSON.parse(response.body);
                        var actors = actorData.cast.filter((c) => { return c.order < 20}).map((c) => { return c.name});
                        
                        movie.actors = actors;
                        var director = actorData.crew.find((c) => { return c.job === "Director"});
                        movie.director = director ? director.name : "";

                        var year = parseInt(movie.releaseDate.split("-")[0]);
                        var queryString = encodeURIComponent(movie.title  + " " + year + ' film');
                        if (DEBUG) { console.log(queryString); }
                        
                        request('https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=' + queryString, function (error, wikiResponse, body) {
                            if (wikiResponse && wikiResponse.statusCode === 200) {
                                var data = JSON.parse(wikiResponse.body);
                                if (data.query && data.query.search[0]) {
                                    requestPlot(movieId, movie, data.query.search);
                                } else {
                                    logger.write("No results found for " + queryString + " - " + movieId + "\n");         
                                }
                            } else {
                                logger.write("Query failed " + queryString + " - " + movieId + "\n");              
                                logger.write(JSON.stringify(error) + "\n");              
                            }
                        });
                    } else {
                        logger.write("Credits Query failed." + " - " + movieId + "\n");              
                        logger.write(JSON.stringify(error) + "\n");              
                    }
                });
            } else {
                // logger.write("TMDB Query failed." + " - " + movieId + "\n");              
                // logger.write(JSON.stringify(error) + "\n");              
            }
        });
        
    }, interval * (i-init), i);
}


requestPlot = (movieId, movie, searchArray) => {
    if (searchArray[0] && similarity(searchArray[0].title, movie.title) > 0.85) {
        request('https://en.wikipedia.org/w/api.php?format=json&redirects=1&indexpageids&action=query&prop=extracts&explaintext=&titles=' + encodeURIComponent(searchArray[0].title), function (error, response, body) {
            if (response && response.statusCode === 200) {
                var data = JSON.parse(response.body);
                if (data.query && data.query.pageids[0] && data.query.pages[data.query.pageids[0]]) {
                    var pageText = data.query.pages[data.query.pageids[0]].extract
                    var pattern = /== (Plot|PlotEdit) ==\n([\S\s]*?)\n\n\n/g;
                    var match = pattern.exec(pageText);
                    if (match && match[2]) {
                        var plot = match[2];
                        sendToElastic(movieId, movie, plot);
                    } else {
                        // try again with second result
                        if (searchArray[1] && similarity(searchArray[1].title, movie.title) > 0.85) {
                            request('https://en.wikipedia.org/w/api.php?format=json&redirects=1&indexpageids&action=query&prop=extracts&explaintext=&titles=' + encodeURIComponent(searchArray[1].title), function (error, response, body) {
                                if (response && response.statusCode === 200) {
                                    var data = JSON.parse(response.body);
                                    if (data.query && data.query.pageids[0] && data.query.pages[data.query.pageids[0]]) {
                                        var pageText = data.query.pages[data.query.pageids[0]].extract
                                        var pattern = /== (Plot|PlotEdit) ==\n([\S\s]*?)\n\n\n/g;
                                        var match = pattern.exec(pageText);
                                        if (match && match[2]) {
                                            var plot = match[2];
                                            sendToElastic(movieId, movie, plot);
                                        } else {
                                            sendToElastic(movieId, movie, "");
                                            logger.write("1Error, couldn't find plot or cast for: " + searchArray[1].title + " - " + movieId + "\n")              
                                            if (DEBUG) { console.log("1Error, couldn't find plot or cast for: " + searchArray[1].title + " - " + movieId + "\n"); }                    
                                        }
                                    }
                                }
                            });
                        } else {
                            if (DEBUG && searchArray[1]) { console.log("Error, didn't match page name: " + searchArray[1].title + " - " + movie.title + " - " + movieId); }                    
                            if (searchArray[1]) { logger.write("Error, didn't match page name: " + searchArray[1].title + " - " + movie.title + " - " + movieId + "\n"); }       
                        }
                        logger.write("Error, couldn't find plot or cast for: " + searchArray[0].title + " - " + movieId + "\n")              
                        if (DEBUG) { console.log("Error, couldn't find plot or cast for: " + searchArray[0].title + " - " + movieId); }                    
                    }
                }
            }
        });
    } else {
        if (DEBUG && searchArray[0]) { console.log("Error, didn't match page name: " + searchArray[0].title + " - " + movie.title + " - " + movieId); }                    
        if (searchArray[0]) { logger.write("Error, didn't match page name: " + searchArray[0].title + " - " + movie.title + " - " + movieId + "\n"); }                    
    }
}


sendToElastic = (movieId, movie, plot) => {
    movie["plot-detailed"] = plot;

    if (DEBUG) { console.log("going to send to elastic:"); }
    if (DEBUG) { console.log(JSON.stringify(movie)); }
    
    if (!DEBUG) {
        request.post('https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies-v7/movie/' + movieId, { json: movie }, function (elasticError, elasticResponse, body) {
            if (DEBUG) { console.log('error:', elasticError); } // Print the error if one occurred
            if (DEBUG) { console.log('statusCode:', elasticResponse && elasticResponse.statusCode); } // Print the response status code if a response was received
            if (DEBUG) { console.log(elasticResponse.body); }
            if (elasticResponse && elasticResponse.statusCode !== 200 && elasticResponse.statusCode !== 201) {
                logger.write("Error sending to elastic - " + movieId + "\n");
                logger.write(elasticResponse.statusCode + "\n");        
                logger.write(JSON.stringify(elasticError) + "\n"); 
            }
        });
    }
}

//for checking title similarity
similarity = (s1, s2) => {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  if (longer.indexOf(shorter) !== -1) { return 1; }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

editDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}