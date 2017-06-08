// 'npm install request --save'
var request = require('request');
var fs = require('fs')

var apiKey = process.env.TMDB_API_KEY;
var interval = 1000 //every second
var logger = fs.createWriteStream('err.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

var DEBUG = true;
var init = 0;
var max = 400000;

for (var i = init; i <= max; i++) {
    
    setTimeout( function (i) {
        var movieId = i;
        if (DEBUG) { console.log(movieId); }

        request('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + apiKey + '&language=en-US', function (error, response, body) {
            if (DEBUG) { console.log('error:', error); }// Print the error if one occurred
            if (DEBUG) { console.log('statusCode:', response && response.statusCode); }// Print the response status code if a response was received

            if (response.statusCode === 200) {
                var data = JSON.parse(response.body);
                var title = data.title;
                var year = parseInt(data.release_date.split("-")[0]);
                
                var queryString = title + " " + year + ' film';
                if (DEBUG) { console.log('search wikipedia for title: ' + queryString); }
                
                request('https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=' + queryString, function (error, response, body) {
                    if (response.statusCode === 200) {
                        var data = JSON.parse(response.body);
                        if (data.query.search[0]) {
                            var title = data.query.search[0].title;
                            if (DEBUG) { console.log("searching for wikipedia page: " + title); }
                            request('https://en.wikipedia.org/w/api.php?format=json&redirects=1&indexpageids&action=query&prop=extracts&exintro=&explaintext=&titles=' + title, function (error, response, body) {
                                if (response.statusCode === 200) {
                                    var data = JSON.parse(response.body);
                                    if (data.query.pageids[0] && data.query.pages[data.query.pageids[0]]) {
                                        var intro = data.query.pages[data.query.pageids[0]].extract
                                        if (DEBUG) { console.log(intro); }
                                        requestPlot(title, intro);
                                    }
                                    
                                } else {
                                    logger.write("Error, couldn't find intro wikipedia page for: " + title + "\n")              
                                    logger.write(JSON.stringify(error) + "\n");              
                                }
                            });
                        } else {
                            logger.write("No results found for " + queryString + "\n");         
                        }
                    } else {
                        logger.write("Query failed " + queryString + "\n");              
                        logger.write(JSON.stringify(error) + "\n");              
                    }
                });
            }

        });
    }, interval * (i-init), i);
}


requestPlot = (title, intro) => {
    request('https://en.wikipedia.org/w/api.php?format=json&redirects=1&indexpageids&action=query&prop=extracts&explaintext=&titles=' + title, function (error, response, body) {
        if (response.statusCode === 200) {
            var data = JSON.parse(response.body);
            if (data.query.pageids[0] && data.query.pages[data.query.pageids[0]]) {
                var pageText = data.query.pages[data.query.pageids[0]].extract
                var pattern = /== (Plot|PlotEdit) ==\n([\S\s]*?)\n\n\n/g;
                var match = pattern.exec(pageText);
                if (match && match[2]) {
                    var plot = match[2];
                    if (DEBUG) { console.log(match[2]); }
                    sendToElastic(title, plot, intro);
                } else {
                    sendToElastic(title, "", intro);
                    logger.write("Error, couldn't find plot for: " + title + "\n")              
                    if (DEBUG) { "Error, couldn't find plot for: " + title; }                    
                }
            }
        } else {
            logger.write("Error, couldn't find plot wikipedia page for: " + title + "\n");
            logger.write(JSON.stringify(error) + "\n");              
        }
    });
}


sendToElastic = (title, plot, intro) => {
    if (DEBUG) { console.log("going to send to elastic..."); }
    var movie = {"title": title, "wikipediaPlot": plot, "wikipediaIntro": intro };
    if (!DEBUG) {
        request.post('https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies/movie', { json: movie }, function (elasticError, elasticResponse, body) {
            if (DEBUG) { console.log('error:', elasticError); } // Print the error if one occurred
            if (DEBUG) { console.log('statusCode:', elasticResponse && elasticResponse.statusCode); } // Print the response status code if a response was received
            if (DEBUG) { console.log(elasticResponse.body); }
            if (elasticResponse.statusCode !== 200 && elasticResponse.statusCode !== 201) {
                logger.write("Error sending to elastic" + "\n");
                logger.write(elasticResponse.statusCode + "\n");        
                logger.write(JSON.stringify(elasticError) + "\n"); 
            }
        });
    }
}