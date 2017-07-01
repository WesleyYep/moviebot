var request = require('request');

var initialQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies-v8/movie/_search?scroll=5m";
var scrollQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/_search/scroll";
var esDomain = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com";
var youtubeURL = "https://www.youtube.com/watch?v=";

const apiKey = process.env.TMDB_KEY;

var numberOfResults = 100;
var interval = 500;

var initOptions = {
    uri: initialQuery,
    method: 'POST',
    json : {
        "size": numberOfResults,
        "_source": ["title"]
    }
}

var movieCount = 0;
var isFinish = false;


function getScrollOption(scrollId) {
    return {
        uri :scrollQuery,
        method: 'POST',
        json : {
            "scroll" : "5m", 
            "scroll_id" : scrollId
        }   
    }
}

function updateTrailerOption(tmdbID, trailerURL, thumbnailURL) {
    return {
        uri: esDomain + "/movies-v8/movie/" + tmdbID + "/_update",
        method: 'POST',
        json : {
            "doc" : {
                "trailerURL" : trailerURL,
                "trailerThumbnailURL" : thumbnailURL
            }
        }
    }
}

var currentScrollId = "";
var i = 1;

function getProcessMovieFunc() {
    return function(movie, currentMovieCount) {
        const tmdbID = movie._id;

        getVideoKey(tmdbID)
            .then((videoKey) =>  updateTrailer(tmdbID, videoKey))        
            .catch((err) => {
                throw new Error(error);
            });

        console.log("Current Movie count:" + currentMovieCount + ", Movie Title: " + movie._source.title + ", Movie Processed:" + movie._id );
    }
}

function getVideoKey(tmdbID) {
    return new Promise((resolve, reject) => { 
        const videoURL = "https://api.themoviedb.org/3/movie/" + tmdbID + "/videos?api_key=" + apiKey;

        request(videoURL, function(error, response, body) {
            if (error != null) {
                console.log('*********GET VIDEO KEY**********')
                console.log(error)
                reject(error)
                return
            }

            if (response.statusCode === 200) {
                jsonBody = JSON.parse(body);
 
                var resultList = jsonBody.results;
                if (resultList.length == 0) {
                    resolve("")
                    return
                }


                var randomUrlKey = "";
                //scan through to find trailer first
                for (index in resultList) {
                    if (resultList[index].site === "YouTube") {
                        if (resultList[index].type === "Trailer" ) {
                            if (resultList[index].key.indexOf("&") < 0) {
                                continue;
                            }

                            resolve(resultList[index].key)
                            return
                        } else {
                            randomUrlKey = resultList[index].key
                        } 
                    } 
                }

                resolve(randomUrlKey)
            } else {
                reject("StatusCode Not 200 when retrieving youtube url");
            }
        })
    })
}

function updateTrailer(tmdbID, videoKey) {
    return new Promise((resolve, reject) => {
        if (videoKey === "") {
            console.log("========================================")
            console.log("No trailer url was found for "  + tmdbID)
            console.log("========================================")
            resolve()
            return
        }

        const trailerURL = youtubeURL + videoKey
        const thumbnailURL = "https://i.ytimg.com/vi/" + videoKey + "/hqdefault.jpg" 

        request(updateTrailerOption(tmdbID, trailerURL, thumbnailURL), function(error, response, body){
            if (error != null) {
                console.log('*********UPDATE TRAILER**********')
                console.log(error)
                reject(error)
                return
            }

            if (response.statusCode === 200) {
                console.log("[VIDEO] id:" + tmdbID + " result : " + body.result + ", trailerURL was " + trailerURL +  ", thumbnailURL was " + thumbnailURL)
                resolve()
            } else {
                reject("StatusCode Not 200 when updating elastic search document");
            }
        })
    })
}

function getScrollingFunc() {
    return function() {
        console.log("==========================")
        console.log("SCROLLING SCROLLING SCROLLING")
        console.log("==========================")
        request(getScrollOption(currentScrollId), function(error, response, body) {
            if (error != null) {
                console.log('*********SCROLLING ERROR**********')
                console.log(error);
                throw new Error(error);
            }

            if (response.statusCode === 200) {
                const results = response.body.hits.hits;

                if (results.length === 0 ) {
                    console.log("==========================")
                    console.log("FINISH FINISH FINISH")
                    console.log("==========================")
                    return;
                }

                currentScrollId = response.body._scroll_id;
                console.log(currentScrollId);

                for (index in results) {
                    const currentMovieCount = i;
                    const movie = results[index]
                    setTimeout(getProcessMovieFunc(), interval * index , movie, currentMovieCount)
                    console.log("Total Number of movie processed:" + i);
                    i++;
                }

                setTimeout(getScrollingFunc(), interval * (numberOfResults + 1));
            }
        })
    }
}


request(initOptions, function (error, response, body) {
    if (error != null) {
        console.log(error);
        return
    }

    if (response.statusCode === 200) {
        const results = response.body.hits.hits;
        currentScrollId = response.body._scroll_id;
        console.log(currentScrollId);

        for (index in results) {
            const currentMovieCount = i;
            const movie = results[index]
            setTimeout(getProcessMovieFunc(), interval * index , movie, currentMovieCount)
            console.log("Total Number of movie processed:" + i);
            i++;
        }

        setTimeout(getScrollingFunc(), interval * (numberOfResults+1));
    }
});


