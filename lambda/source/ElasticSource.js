'use strict';
var AWS = require('aws-sdk')

var movieBuilder = require('../model/Movie'); 

var esUri = 'search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com';
var movieIndexName = 'movies-v9';
var movieType = 'movie';

// This returns a promise. Async operation.
var getMovies = function(body) {
    return new Promise((resolve, reject) => {
        query(body, movieIndexName, movieType).then((responseBody) => {
            const results = JSON.parse(responseBody).hits.hits;
            const movies = results.map(function(movie) {
                const title = movie._source.title;
                return movieBuilder.builder(title).build();
            });
            console.log("retrieved movies: ");
            console.log(movies);
            resolve(movies);
        }).catch((err) => {
            console.log('Error: ' + err);
            reject(err)
        })
    });
};

var query = function(body, index, type) {
    console.log("calling get movies of elastic source for: " + JSON.stringify(body));

    return new Promise((resolve, reject) => {
        var endpoint = new AWS.Endpoint(esUri)
        var req = new AWS.HttpRequest(endpoint);
        req.method = 'POST';
        req.path = '/' + index + '/' + type + '/_search';
        req.region = 'us-east-1';
        req.headers['presigned-expires'] = false;
        req.headers['Host'] = endpoint.host;
        req.headers['Content-Type'] = "application/json";
        req.body = JSON.stringify(body);

        var creds = new AWS.EnvironmentCredentials('AWS');
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
                resolve(body);
            });
        }, function(err){
            console.log('Error: ' + err);
            reject(err)
        });

    });
}

module.exports = {
    getMovies: getMovies,
    query: query
};