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

            it('should update movies with information retrieved from different sources', function() {
                // GIVEN
                // a movies list which contains multiple sources
                var movies = [];
                const firstMovieSource = new Array(
                    movieBuilder.builder('StubTitle').withGenre('Action').withDirector('Peter Jackson').withPlot('Ring chasers').build(),
                    movieBuilder.builder('StubTitle2').withGenre('Horror').build(),
                    movieBuilder.builder('The Dark Knight').withTrailerUrl('dark knight trailer url').withPosterUrl('dark knight poster url').build()
                );

                const secondMovieSource = new Array(
                    movieBuilder.builder('The Dark Knight Rises').build(),
                    movieBuilder.builder('StubTitle').withGenre('Action').build(),
                    movieBuilder.builder('The Dark Knight').withTrailerUrl('dark knight fake trailer url').withGenre('Superhero').build(),
                    movieBuilder.builder('Get Out').build()
                );

                const thirdMovieSource = new Array(
                    movieBuilder.builder('Get Out').withGenre('Thriller').build(),
                    movieBuilder.builder('StubTitle').withGenre('Romance').withTrailerDescription('StubTitle trailer description').withReleaseDate('StubTitle release date').build(),
                    movieBuilder.builder('The Dark Knight').withPosterUrl('dark knight poster url').withTrailerThumbnail('dark knight trailer thumbnail').build(),
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
                expect(aggregatedMovies.some(e => e.equals(movieBuilder.builder('The Dark Knight').build()))).to.be.true;

                // retrieve and then assert
                var aggregatedStubTitleMovie = aggregatedMovies.find(e => e.equals(movieBuilder.builder('StubTitle').build()));
                expect(aggregatedStubTitleMovie).to.not.equal(undefined);
                expect(aggregatedStubTitleMovie.getTitle()).to.equal('StubTitle');
                expect(aggregatedStubTitleMovie.getDirector()).to.equal('Peter Jackson');
                expect(aggregatedStubTitleMovie.getReleaseDate()).to.equal('StubTitle release date');
                expect(aggregatedStubTitleMovie.getPlot()).to.equal('Ring chasers');
                expect(aggregatedStubTitleMovie.getGenre()).to.equal('Action');
                expect(aggregatedStubTitleMovie.getTrailerUrl()).to.equal(undefined);
                expect(aggregatedStubTitleMovie.getTrailerDescription()).to.equal('StubTitle trailer description');
                expect(aggregatedStubTitleMovie.getTrailerThumbnail()).to.equal(undefined);
                expect(aggregatedStubTitleMovie.getPosterUrl()).to.equal(undefined);

                const aggregatedDarkKnightMovie = aggregatedMovies.find(e => e.equals(movieBuilder.builder('The Dark Knight').build()));
                expect(aggregatedDarkKnightMovie).to.not.equal(undefined);
                expect(aggregatedDarkKnightMovie.getTitle()).to.equal('The Dark Knight');
                expect(aggregatedDarkKnightMovie.getDirector()).to.equal(undefined);
                expect(aggregatedDarkKnightMovie.getReleaseDate()).to.equal(undefined);
                expect(aggregatedDarkKnightMovie.getPlot()).to.equal(undefined);
                expect(aggregatedDarkKnightMovie.getGenre()).to.equal('Superhero');
                expect(aggregatedDarkKnightMovie.getTrailerUrl()).to.equal('dark knight trailer url');
                expect(aggregatedDarkKnightMovie.getTrailerDescription()).to.equal(undefined);
                expect(aggregatedDarkKnightMovie.getTrailerThumbnail()).to.equal('dark knight trailer thumbnail');
                expect(aggregatedDarkKnightMovie.getPosterUrl()).to.equal('dark knight poster url');
                
            });
        });
    });
});