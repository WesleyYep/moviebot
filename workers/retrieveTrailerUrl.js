var request = require('request');

var initialQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies-v8/movie/_search?scroll=5m";
var scrollQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/_search/scroll";
var esDomain = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com";
var youtubeURL = "https://www.youtube.com/watch?v=";

const apiKey = process.env.TMDB_KEY;
const youtubeApiKey = process.env.GOOGLE_DEVELOPER_KEY;

var numberOfResults = 100;
var interval = 750;

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
            .then((keyTypeMap) => checkYoutubeVideoExist(keyTypeMap))
            .then((videoKey) =>  updateTrailer(tmdbID, videoKey))        
            .catch((err) => {
                throw new Error(err);
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
                console.log(jsonBody)
                var resultList = jsonBody.results;
                if (resultList.length == 0) {
                    resolve("")
                    return
                }


                const keyTypeMap = {}
                //scan through to find trailer first
                for (index in resultList) {
                    if (resultList[index].site === "YouTube") {
                        if (resultList[index].key == null) {
                            continue;
                        }
                        
                        if (resultList[index].key.indexOf("&") >= 0) {
                            continue;
                        }

                        keyTypeMap[resultList[index].key] = resultList[index].type
                    } 
                }

                resolve(keyTypeMap)
            } else {
                reject("StatusCode Not 200 when retrieving youtube url");
            }
        })
    })
}

function checkYoutubeVideoExist(keyTypeMap) {
    return new Promise((resolve, reject) => {
        var keyStrings = "";
        for (key in keyTypeMap) {
            keyStrings += (key + ",");
        }

        if (keyStrings === "") {
            resolve("")
            return
        }

        //strip out the extra , at the end
        const finalKeyStrings = keyStrings.substr(0, keyStrings.length-2)

        const singleYoutubeURL = "https://www.googleapis.com/youtube/v3/videos?id=" + finalKeyStrings + "&key=" + youtubeApiKey + "&part=snippet"

        request(singleYoutubeURL, function(error, response, body) {
            if (error != null) {
                console.log('*********CHECK YOUTUBE VIDEO EXISTS**********')
                console.log(error)
                reject(error)
                return
            }

            if (response.statusCode === 200 ) {
                var jsonBody = JSON.parse(body);

                if (jsonBody.items.length === 0) {
                    resolve("")
                } else {
                    var videoKey = "";

                    for (index in jsonBody.items) {
                        videoKey = jsonBody.items[index].id
                        if ( keyTypeMap[videoKey] === "Trailer" ) {
                            break;
                        } 
                    }
                    
                    if (videoKey === "") {
                        console.log("[VALIDATION] id:" + finalKeyStrings + " was not valid at all")
                        resolve("")
                    } else {
                        console.log("[VALIDATION] id:" + videoKey + " is valid youtube video and type is " + keyTypeMap[videoKey])
                        resolve(videoKey)
                    }
                }
            } else {
                reject("StatusCode Not 200 when updating elastic search document");
            }
        })
    })
}

function updateTrailer(tmdbID, videoKey) {
    return new Promise((resolve, reject) => {

        var trailerURL = youtubeURL + videoKey
        var thumbnailURL = "https://i.ytimg.com/vi/" + videoKey + "/hqdefault.jpg" 

        if (videoKey === "") {
            console.log("========================================")
            console.log("No trailer url was found for "  + tmdbID)
            console.log("========================================")

            trailerURL = ""
            thumbnailURL = ""
        } 

        const finalTrailerURL = trailerURL
        const finalThumnbnailURL = thumbnailURL

        request(updateTrailerOption(tmdbID, finalTrailerURL, finalThumnbnailURL), function(error, response, body){
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


