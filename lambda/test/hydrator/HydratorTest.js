var expect = require('chai').expect;
var movieBuilder = require('../../model/Movie');
var movieHydrator = require('../../hydrator/Hydrator')

describe('HydratorTest', function() {
    describe('#hydrate', function() {
        it('should fill a movie object that have a title only', function() {
            var testMovieList = []
            var testMovie = movieBuilder.builder('Man of Steel').build();
            testMovieList.push(testMovie)

            movieHydrator.hydrate(testMovieList).then( (movieList) => {
                expect(movieList[0].getTitle()).to.be.equal('Man of Steel')
                expect(movieList[0].getReleaseDate()).to.be.equal('2013-06-12')
                expect(movieList[0].getDirector()).to.be.equal('Zack Snyder')
                expect(movieList[0].getTrailerUrl()).to.be.equal('https://www.youtube.com/watch?v=KVu3gS7iJu4')
                expect(movieList[0].getTrailerThumbnail).to.be.equal('https://i.ytimg.com/vi/KVu3gS7iJu4/hqdefault.jpg')
            }).catch((err) => {
                throw new Error(err)
            })
        })
    })
})