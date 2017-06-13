'use strict';
var AWS = require('aws-sdk')

var movieBuilder = require('../model/Movie');

// This returns a promise. Async operation.
var getMovies = function(plot) {
    // encode the plot
    console.log("calling get movies of elastic source for plot: " + plot);

    return new Promise((resolve, reject) => {
        var endpoint = new AWS.Endpoint('search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com')
        var creds = new AWS.EnvironmentCredentials('AWS');
        var req = new AWS.HttpRequest(endpoint);
        req.method = 'POST';
        req.path = '/movies/movie/_search';
        req.region = 'us-east-1';
        req.headers['presigned-expires'] = false;
        req.headers['Host'] = endpoint.host;
        req.headers['Content-Type'] = "application/json";
        req.body = JSON.stringify({
            "query": {
                "match": {
                    "wikipediaPlot": plot
                }
            }
        });
        var signer = new AWS.Signers.V4(req, 'es');
        signer.addAuthorization(creds, new Date());
        var send = new AWS.NodeHttpClient();
        send.handleRequest(req, null, function(httpResp) {
            var body = '';
            httpResp.on('data', function (chunk) {
                body += chunk;
            });
            
            httpResp.on('end', function (chunk) {
                console.log(body);
                const results = JSON.parse(body).hits.hits;
                const movies = results.map(function(movie) {
                    const title = movie._source.title;
                    return movieBuilder.builder(title).build();
                });
                console.log("retrieved movies: ");
                console.log(movies);
                resolve(movies);
            });
        }, function(err){
            console.log('Error: ' + err);
            context.fail();
        });

    });
};

module.exports = {
    getMovies: getMovies
};