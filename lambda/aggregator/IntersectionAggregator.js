/**
 * List of lists
 * @param {*} movies 
 */
var aggregate = function(movies) {
    if (movies.length == 0) {
        return [];
    }

    if (movies.length == 1) {
        return movies[0];
    }

    // extracts the first movie list of the movies list and then checks each movie in the first movie list if
    // every other movie list contains the same movie
    return movies.shift().filter(function(movie, index, arr) {
        return movies.every(function(m) {
            const matchingMovies = m.filter((elem) => elem.equals(movie));

            matchingMovies.forEach((matchingMovie) => {
                // update movie by retrieving the actual object.
                // NOTE in function parameters, elements always passed by value
                // always favour existing value
                var actualMovie = arr[index];
                actualMovie.setTitle(movie.getTitle() ? movie.getTitle() : matchingMovie.getTitle());
                actualMovie.setDirector(movie.getDirector() ? movie.getDirector() : matchingMovie.getDirector());
                actualMovie.setReleaseDate(movie.getReleaseDate() ? movie.getReleaseDate() : matchingMovie.getReleaseDate());
                actualMovie.setPlot(movie.getPlot() ? movie.getPlot() : matchingMovie.getPlot());
                actualMovie.setGenre(movie.getGenre() ? movie.getGenre() : matchingMovie.getGenre());
                actualMovie.setTrailerUrl(movie.getTrailerUrl() ? movie.getTrailerUrl() : matchingMovie.getTrailerUrl());
                actualMovie.setTrailerDescription(movie.getTrailerDescription() ? movie.getTrailerDescription() : matchingMovie.getTrailerDescription());
                actualMovie.setTrailerThumbnail(movie.getTrailerThumbnail() ? movie.getTrailerThumbnail() : matchingMovie.getTrailerThumbnail());
                actualMovie.setPosterUrl(movie.getPosterUrl() ? movie.getPosterUrl() : matchingMovie.getPosterUrl());
            });

            return matchingMovies.length > 0;
        });
    });
};

module.exports = {
    aggregate: aggregate
}