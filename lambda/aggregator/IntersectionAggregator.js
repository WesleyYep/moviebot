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
    return movies.shift().filter(function(movie) {
        return movies.every(function(m) {
            return m.some(elem => elem.equals(movie));
        });
    });
};

module.exports = {
    aggregate: aggregate
}