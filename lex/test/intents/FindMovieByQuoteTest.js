var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("FindMovieByQuote intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    // quote to test
    const quote = "You either die a hero or you live long enough to die a villain";

    const openingUtterancesToElicitSlot = [
        "I would like to filter by quote",
        "find by quote",
        "filter by quote",
        "can i find by quote"
    ];

    const openingUtterancesToContinueFinding = [
        "The movie has \"" + quote + "\" quote in it",
        "\"" + quote + "\" quote is in it",
        "A quote is \"" + quote + "\""
    ];

    before("Initialise http variables and signature", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();
    });

    openingUtterancesToElicitSlot.forEach((openingUtterance) => {
        it("should elicit slot given opening utterance \'" + openingUtterance + "\' and then return matching movies", function() {
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
                expect(res.message).to.match(/^Hey! We found [0-9]{1,2} matching movies\. .* Did we find your movie\? Or still unsure \?/);
                expect(res).to.have.own.property('responseCard');
            });
        });
    })

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
                expect(res.message).to.match(/^Hey! We found [0-9]{1,2} matching movies\. .* Did we find your movie\? Or still unsure \?/);
                expect(res).to.have.own.property('responseCard');
            });
        });
    });

});