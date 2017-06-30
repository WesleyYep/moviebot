'use strict';
const apiKey = process.env.BING_KEY;

var rp = require('request-promise');
var AWS = require('aws-sdk')

var esUri = 'search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com';
var movieIndexName = 'movies-v8';
var movieType = 'movie';

var movieBuilder = require('../model/Movie');

var getMovies = function(queryString) {
    const encodeQueryString = "imdb movie about " + encodeURI(queryString);
    var options = {
        uri: 'https://api.cognitive.microsoft.com/bing/v5.0/search?count=20&responseFilter=webpages&q=' + encodeQueryString,
        json: true,
        headers: {
            'Ocp-Apim-Subscription-Key': apiKey
        },
    };
    return new Promise(function(resolve, reject) {
        rp(options).then(function(res) {
            if (res.webPages && res.webPages.value) {
                var movies = res.webPages.value.filter((m) => {
                    return m.name.match(/.*\(\d{4}\).* - IMDb/g);
                }).map((m) => {
                    return m.name.split(/\(\d{4}\)/g)[0].trim();
                });
                console.log(movies);
                var body = {
                    "query" : {
                        "bool" : {
                            "should" : []
                        }
                    }
                } 
                movies.forEach((m) => {
                    body.query.bool.should.push({ "term": { "title": m }})
                })
                var endpoint = new AWS.Endpoint(esUri)
                var req = new AWS.HttpRequest(endpoint);
                req.method = 'POST';
                req.path = '/' + movieIndexName + '/' + movieType + '/_search';
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
            }
        })
        .catch(function(err) {
            console.log('Error unable to retrieve the movie list');
            console.log(err);
        });
    });
};

module.exports = {
    searchMovie : searchMovie
}



