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

    it('should find Lord of the rings', function() {
        this.timeout(5000);
        return bingSource.getMovies("guy throws ring into volcano").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "The Lord of the Rings: The Fellowship of the Ring"})).to.not.equal(undefined)
        })
    });

    it('should find Star Wars: Episode IV', function() {
        this.timeout(5000);
        return bingSource.getMovies("jedi blows up death star").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Star Wars"})).to.not.equal(undefined)
        })
    });

    it('should find Now You See Me', function() {
        this.timeout(5000);
        return bingSource.getMovies("magician robbing bank").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Now You See Me"})).to.not.equal(undefined)
        })
    });

    it('should find Contagion', function() {
        this.timeout(5000);
        return bingSource.getMovies("infectious disease that caused everyone to be zombie").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Contagion"})).to.not.equal(undefined)
        })
    });

    it('should find X-men DOFP', function() {
        this.timeout(5000);
        return bingSource.getMovies("wolverine travels back in time to save mutants").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "X-Men: Days of Future Past"})).to.not.equal(undefined)
        })
    });

    it('should find The Magnificent Seven', function() {
        this.timeout(5000);
        return bingSource.getMovies("seven cowboys gathered to save a village from a tyrant").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "The Magnificent Seven"})).to.not.equal(undefined)
        })
    });

    it('should find TMNT', function() {
        this.timeout(5000);
        return bingSource.getMovies("4 turtles and a rat").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Teenage Mutant Ninja Turtles"})).to.not.equal(undefined)
        })
    });

    it('should find Cast Away', function() {
        this.timeout(5000);
        return bingSource.getMovies("plane crash and man is alone on an island").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Cast Away"})).to.not.equal(undefined)
        })
    });

    it('should find Dawn of the Planet of the Apes', function() {
        this.timeout(5000);
        return bingSource.getMovies("apes riding horses").then((movies) => {
            expect(movies.find((m) => {return m.getTitle() === "Dawn of the Planet of the Apes"})).to.not.equal(undefined)
        })
    });

});