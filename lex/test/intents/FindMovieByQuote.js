var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("FindMovieByQuote intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    before("Initialise http variables and signature", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();
    });

    it("should return movies given quote", function() {
        // GIVEN
        var text = "I would like to filter by quote";
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

            text = "You either die a hero or you live long enough to die a villain"
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

});