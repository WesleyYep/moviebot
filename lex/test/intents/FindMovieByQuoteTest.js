var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("FindMovieByQuote intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    // quote to test
    const quotes = [
        "You either die a hero or you live long enough to become a villain",
        "Frankly, my dear, I don't give a damn",
        "I'm gonna make him an offer he can't refuse"
    ];

    const openingUtterancesToElicitSlot = [
        "I would like to filter by quote",
        "find by quote",
        "filter by quote",
        "can i find by quote"
    ];

    var openingUtterancesToContinueFinding = [];

    before("Initialise http variables, signature and quotes", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();

        quotes.forEach((quote) => {
            openingUtterancesToContinueFinding.push("The movie has \"" + quote + "\" quote in it");
            openingUtterancesToContinueFinding.push("\"" + quote + "\" quote is in it");
            openingUtterancesToContinueFinding.push("A quote is \"" + quote + "\"");
        });
    });

    beforeEach(function(done){
        this.timeout(2000);
        setTimeout(done, 1900);
    })

    openingUtterancesToElicitSlot.forEach((openingUtterance) => {
        quotes.forEach((quote) => {
            it("should elicit slot given opening utterance \'" + openingUtterance + "\' and then return matching movies with quote \'" + quote + "\'", function() {
                // GIVEN
                var text = openingUtterance;
                lexHelper.logUser(text);

                // set timeout
                this.timeout(20000);

                const options = lexHelper.generateOptions(accessKey, secretKey, region);
                const userId = lexHelper.generateUserId();

                var lexruntime = new AWS.LexRuntime(options);

                var params = lexHelper.generateParams(botName, botAlias, userId, text);
                var result = lexruntime.postText(params).promise();

                // WHEN
                return result.then((res) => {
                    // THEN
                    lexHelper.logBot(res.message);
                    expect(res.dialogState).to.equal('ElicitSlot');
                    expect(res.message).to.equal("What quote is in the movie?");

                    text = quote;
                    lexHelper.logUser(text);
                    params = lexHelper.generateParams(botName, botAlias, userId, text);

                    return lexruntime.postText(params).promise();
                }).then((res) => {
                    // THEN
                    lexHelper.logBot(res.message);
                    expect(res.dialogState).to.equal('ConfirmIntent');
                    expect(res.intentName).to.equal('ContinueFinding');
                    expect(res.message).to.match(/^Hey! We found [0-9]{1,2} matching movies\. .* Did we find your movie\(yes\/no to continue searching\)\?/);
                    expect(res).to.have.own.property('responseCard');
                });
            });
        });
    });

    openingUtterancesToContinueFinding.forEach((openingUtterance) => {
        it("should return matching movies given opening utterance \'" + openingUtterance + "\'", function() {
            // GIVEN
            var text = openingUtterance;
            lexHelper.logUser(text);

            // set timeout
            this.timeout(20000);

            const options = lexHelper.generateOptions(accessKey, secretKey, region);
            const userId = lexHelper.generateUserId();

            var lexruntime = new AWS.LexRuntime(options);

            var params = lexHelper.generateParams(botName, botAlias, userId, text);
            var result = lexruntime.postText(params).promise();

            // WHEN
            return result.then((res) => {
                // THEN
                lexHelper.logBot(res.message);
                expect(res.dialogState).to.equal('ConfirmIntent');
                expect(res.intentName).to.equal('ContinueFinding');
                expect(res.message).to.match(/^Hey! We found [0-9]{1,2} matching movies\. .* Did we find your movie\(yes\/no to continue searching\)\?/);
                expect(res).to.have.own.property('responseCard');
            });
        });
    });

});