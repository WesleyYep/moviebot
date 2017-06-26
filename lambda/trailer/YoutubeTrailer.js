var rp = require('request-promise');

const apiKey = process.env.GOOGLE_DEVELOPER_KEY;

var apply = function(movieList) {
    console.log("Finding trailer information for movie list");

    return new Promise(function(resolve, reject) {
        var moviePromises = movieList.map(movie => {
            return new Promise(function(resolve, reject) {
                const encodeTitle = encodeURI(movie.getTitle() + " film trailer");
                var options = {
                    uri: 'https://www.googleapis.com/youtube/v3/search?type=video&videoDuration=short&part=snippet&q=' + encodeTitle + '&key=' + apiKey,
                    json: true
                };

                rp(options)
                    .then(function(res) {
                        console.log("Found trailer information for " + movie.getTitle());
                        console.log(res);

                        // maybe some error check
                        if (res.items.length == 0) {
                            // log that no trailers were found.
                            console.log("No trailers were found");
                        }

                        // extract most relevant item
                        const item = res.items[0];

                        const videoId = item.id.videoId;
                        const trailerDescription = item.snippet.description;
                        const trailerThumbnail = item.snippet.thumbnails.high.url;

                        const trailerUrl = "https://www.youtube.com/watch?v=" + videoId;

                        movie.setTrailerUrl(trailerUrl);
                        movie.setTrailerDescription(trailerDescription);
                        movie.setTrailerThumbnail(trailerThumbnail);

                        resolve(movie);
                    }).catch(function(err) {
                        reject();
                    });
            });
        });

        Promise.all(moviePromises).then(updatedMovieList => {
            console.log(updatedMovieList);
            resolve(updatedMovieList);
        }).catch((err) => {
            reject(err);
        });
    });
};

module.exports = {
    apply: apply
};