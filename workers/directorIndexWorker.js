var request = require('request');

var initialQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/movies-v8/movie/_search?scroll=5m";
var scrollQuery = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/_search/scroll";
var insertDirectorName = "https://search-moviebot-squiezr3n3t55xzc3c46awndia.us-east-1.es.amazonaws.com/directors-v2/director";

var numberOfResults = 100;
var interval = 1000;

var initOptions = {
    uri: initialQuery,
    method: 'POST',
    json : {
        "size": numberOfResults,
        "_source": ["director"]
    }
}

var movieCount = 0;
var isFinish = false;
const seenMap = {};
var directorCount = 0;

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

function insertDirectorDocumentOption(id, directorName) {
    return {
        uri: insertDirectorName + "/" + id,
        method: 'PUT',
        json : {
            "directorName" : directorName
        }
    }
}

var currentScrollId = "";
var i = 1;

function getProcessMovieFunc() {
    return function(movie, currentMovieCount) {
        const name = movie._source.director;
        if (!name) {
            return;
        }
        const title = movie._source.title;
        if (!(name in seenMap)) {
            seenMap[name] = true;
            directorCount++;
            request(insertDirectorDocumentOption(directorCount, name), function(error, response, body) {
                if (error != null) {
                    console.log(error);
                    throw new Error("Didn't work for" + name + " and movie is " + title);
                }

                if (response.statusCode === 201) {
                    console.log("Director processed: " + name);
                } else {
                    console.log(response.body)
                    throw new Error("Didn't work for" + name + " and movie is " + title);
                }
            })
        }
        console.log("Current Movie count:" + currentMovieCount + " Movie Processed:" + movie._id + " Seen Map Size:" + Object.keys(seenMap).length);
    }
}

function getScrollingFunc() {
    return function() {
        console.log("==========================")
        console.log("SCROLLING SCROLLING SCROLLING")
        console.log("==========================")
        request(getScrollOption(currentScrollId), function(error, response, body) {
            if (error != null) {
                console.log(error);
                return;
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
                    setTimeout(getProcessMovieFunc(), interval * index , results[index], currentMovieCount)
                    i++;
                    console.log("Total Number of movie processed:" + i);
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
            setTimeout(getProcessMovieFunc(), interval * index , results[index], currentMovieCount)
            i++;
            console.log("Total Number of movie processed:" + i);
        }

        setTimeout(getScrollingFunc(), interval * (numberOfResults+1));
    } else {
        console.log(response.statusCode)
    }
});


