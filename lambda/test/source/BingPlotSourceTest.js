var expect = require('chai').expect;
var bingSource = require('../../source/BingSource');

describe('BingSourceTest', function() {
    
    it('should find The Mask', function() {
        this.timeout(5000);
        return bingSource.getMovies("guy wears a green mask").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "The Mask"})).to.not.equal(undefined)
        })
    });

    it('should find Pacific Rim', function() {
        this.timeout(5000);
        return bingSource.getMovies("giant robot fights giant alien").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Pacific Rim"})).to.not.equal(undefined)
        })
    });

    it('should find The Force Awakens', function() {
        this.timeout(5000);
        return bingSource.getMovies("girl finds droid and learns she has jedi powers").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Star Wars: The Force Awakens"})).to.not.equal(undefined)
        })
    });

    it('should find Snowpiercer', function() {
        this.timeout(5000);
        return bingSource.getMovies("a train that never stop and the earth is inhabitable").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Snowpiercer"})).to.not.equal(undefined)
        })
    });

    it('should find Whiplash', function() {
        this.timeout(5000);
        return bingSource.getMovies("a drummer that get yell at by the teacher").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Whiplash"})).to.not.equal(undefined)
        })
    });

    it('should find Taken', function() {
        this.timeout(5000);
        return bingSource.getMovies("daughter kidnapped overseas and dad travels to rescue her").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Taken"})).to.not.equal(undefined)
        })
    });

    // bingSource.getMovies("guy throws ring into volcano");
    // bingSource.getMovies("jedi blows up death star");
    // bingSource.getMovies("magician robbing bank");
    // bingSource.getMovies("infectious disease that caused everyone to be zombie");
    // bingSource.getMovies("wolverine travels back in time to save mutants");
    // bingSource.getMovies("seven cowboys gathered to save a village from a tyrant");
    // bingSource.getMovies("4 turtles and a rat");
    // bingSource.getMovies("plane crash and man is alone on an island");
    // bingSource.getMovies("apes riding horses");

});