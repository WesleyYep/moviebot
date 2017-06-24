var expect = require('chai').expect;
var removeFilmStopWords = require('../../source/WikiQuoteSource').removeFilmStopWords;

describe('WikiQuoteSourceTest', function() {
    describe('#removeFilmStopWords', function() {
        it('should return original string', function() {
            // GIVEN
            const input = [
                'The Dark Knight',
                'The Godfather',
                'The Lord of the Rings: The Fellowship of the Ring',
                '2 Fast 2 Furious'
            ];

            input.forEach((title) => {
                // WHEN
                const editedTitle = removeFilmStopWords(title);

                // THEN
                expect(editedTitle).to.equal(title);
            });
        });

        it('should return edited string', function() {
            // GIVEN
            const wonderWoman = 'Wonder Woman (2017 film)';
            const planetOfTheApes = 'Dawn of the Planet of the Apes (2014 Film)';
            const getOut = 'Get Out (Film)';

            // WHEN
            const wonderWomanEdited = removeFilmStopWords(wonderWoman);
            const planetOfTheApesEdited= removeFilmStopWords(planetOfTheApes);
            const getOutEdited = removeFilmStopWords(getOut);

            // THEN
            expect(wonderWomanEdited).to.equal('Wonder Woman');
            expect(planetOfTheApesEdited).to.equal('Dawn of the Planet of the Apes');
            expect(getOutEdited).to.equal('Get Out');
        });
    });
});