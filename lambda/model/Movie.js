'use strict';

class Movie {
    constructor(title, director, releaseDate, plot, genre, trailerUrl, trailerDescription, trailerThumbnail, posterUrl) {
        this.title = title;
        this.director = director;
        this.releaseDate = releaseDate;
        this.plot = plot;
        this.genre = genre;
        this.trailerUrl = trailerUrl;
        this.trailerDescription = trailerDescription;
        this.trailerThumbnail = trailerThumbnail;
        this.posterUrl = posterUrl;
    }

    getTitle() {
        return this.title;
    }

    setTitle(title) {
        this.title = title;
    }

    getDirector() {
        return this.director;
    }

    setDirector(director) {
        this.director = director;
    }

    getReleaseDate() {
        return this.releaseDate;
    }

    setReleaseDate(releaseDate) {
        this.releaseDate = releaseDate;
    }

    getPlot() {
        return this.plot;
    }

    setPlot(plot) {
        this.plot = plot;
    }

    getGenre() {
        return this.genre;
    }

    setGenre(genre) {
        return this.genre;
    }

    getTrailerUrl() {
        return this.trailerUrl;
    }

    setTrailerUrl(trailerUrl) {
        this.trailerUrl = trailerUrl;
    }

    getTrailerDescription() {
        return this.trailerDescription;
    }

    setTrailerDescription(trailerDescription) {
        this.trailerDescription = trailerDescription;
    }

    getTrailerThumbnail() {
        return this.trailerThumbnail;
    }

    setTrailerThumbnail(trailerThumbnail) {
        this.trailerThumbnail = trailerThumbnail;
    }

    getPosterUrl() {
        return this.posterUrl;
    }

    setPosterUrl(posterUrl) {
        this.posterUrl = posterUrl;
    }

    equals(otherMovie) {
        return this.title == otherMovie.getTitle();
    }
}

var builder = function(title) {
    
    var movieTitle = title;
    var movieDirector = undefined;
    var movieReleaseDate = undefined;
    var moviePlot = undefined;
    var movieGenre = undefined;
    var movieTrailerUrl = undefined;
    var movieTrailerDescription = undefined;
    var movieTrailerThumbnail = undefined;
    var moviePosterUrl = undefined;

    return {
        withDirector: function(director) {
            movieDirector = director;
            return this;
        },
        withReleaseDate: function(releaseDate) {
            movieReleaseDate = releaseDate;
            return this;
        },
        withPlot: function(plot) {
            moviePlot = plot;
            return this;
        },
        withGenre: function(genre) {
            movieGenre = genre;
            return this;
        },
        withTrailerUrl: function(trailerUrl) {
            movieTrailerUrl = trailerUrl;
            return this;
        },
        withTrailerDescription: function(trailerDescription) {
            movieTrailerDescription = trailerDescription;
            return this;
        },
        withTrailerThumbnail: function(trailerThumbnail) {
            movieTrailerThumbnail = trailerThumbnail;
            return this;
        },
        withPosterUrl: function(posterUrl) {
            moviePosterUrl = posterUrl;
            return this;
        },
        build: function() {
            return new Movie(movieTitle, movieDirector, movieReleaseDate, moviePlot, movieGenre, movieTrailerUrl, movieTrailerDescription, movieTrailerThumbnail, moviePosterUrl);
        }
    }

};

module.exports = {
    builder: builder
};