'use strict';

class Movie {
    constructor(title) {
        this.title = title;
    }

    getTitle() {
        return this.title;
    }
}

var builder = function(title) {
    
    var movieTitle = title;
    var movieGenre = "";

    return {
        withGenre: function(genre) {
            movieGenre = genre;
            return this;
        },
        build: function() {
            return new Movie(movieTitle);
        }
    }

};

module.exports = {
    builder: builder
};