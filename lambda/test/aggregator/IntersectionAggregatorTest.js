var expect = require('chai').expect;
var aggregator = require('../../aggregator/IntersectionAggregator');
var movieBuilder = require('../../model/Movie');

describe('IntersectionAggregatorTest', function() {
    describe('#aggregate', function() {
        it('should return first list if there is only one source', function() {
            // GIVEN
            // a movies list which has only one source
            var movies = [];
            const stubMovie = movieBuilder.builder('StubTitle').build();
            const firstMovieSource = new Array(stubMovie);

            movies.push(firstMovieSource);

            // WHEN
            // aggregate movie sources into a single movie list
            const aggregatedMovies = aggregator.aggregate(movies);

            // THEN
            // expect behaviour
            expect(Array.isArray(aggregatedMovies)).to.be.true;
            expect(aggregatedMovies.length).to.equal(firstMovieSource.length);
            expect(aggregatedMovies).to.include(stubMovie);
        });

        describe('Intersection of movie sources', function() {
            it('should return empty list if one of the sources contain no movies', function() {
                // GIVEN
                // a movies list which contains multiple sources
                var movies = [];
                const firstMovieSource = new Array(movieBuilder.builder('StubTitle').build());
                const secondMovieSource = new Array(movieBuilder.builder('StubTitle').build());
                const thirdMovieSource = []; // third source returned no movies

                movies.push(firstMovieSource, secondMovieSource, thirdMovieSource);

                // WHEN
                // aggregate movie sources into a single movie list
                const aggregatedMovies = aggregator.aggregate(movies);

                // THEN
                // expect behaviour
                expect(Array.isArray(aggregatedMovies)).to.be.true;
                expect(aggregatedMovies.length).to.equal(0);
            });

            it('should return intersection of list if there are movies from multiple sources', function() {
                // GIVEN
                // a movies list which contains multiple sources
                var movies = [];
                const firstMovieSource = new Array(
                    movieBuilder.builder('StubTitle').build(),
                    movieBuilder.builder('StubTitle2').withGenre('Horror').build(),
                    movieBuilder.builder('The Dark Knight').build()
                );

                const secondMovieSource = new Array(
                    movieBuilder.builder('The Dark Knight Rises').build(),
                    movieBuilder.builder('StubTitle').withGenre('Action').build(),
                    movieBuilder.builder('The Dark Knight').withGenre('Superhero').build(),
                    movieBuilder.builder('Get Out').build()
                );

                const thirdMovieSource = new Array(
                    movieBuilder.builder('Get Out').withGenre('Thriller').build(),
                    movieBuilder.builder('StubTitle').withGenre('Romance').build(),
                    movieBuilder.builder('The Dark Knight').build(),
                    movieBuilder.builder('The Godfather').withGenre('Mafia').build()
                );

                movies.push(firstMovieSource, secondMovieSource, thirdMovieSource);

                // WHEN
                // aggregate movie sources into a single list
                const aggregatedMovies = aggregator.aggregate(movies);

                // THEN
                // expect behaviour
                expect(Array.isArray(aggregatedMovies)).to.be.true;
                expect(aggregatedMovies.length).to.equal(2);
                expect(aggregatedMovies.some(e => e.equals(movieBuilder.builder('StubTitle').build()))).to.be.true;
                expect(aggregatedMovies.some(e => e.equals(movieBuilder.builder('The Dark Knight').build()))).to.be.true;
            });
        });
    });
});