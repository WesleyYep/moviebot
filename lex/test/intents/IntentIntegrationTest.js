var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("Intent integration", function() {
    var botName, botAlias, accessKey, secretKey, region;

    before("Initialise http variables and signature", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();
    });

    beforeEach(function(done) {
        this.timeout(2000);
        setTimeout(done, 1900);
    });

    it("should filter movies after searching by actor and quote", function() {
        // GIVEN
        var actor = "Christian Bale";
        var quote = "Such a waste. All that passion- for nothing";
        var text = "find by actor";
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
            expect(res.message).to.equal("Sure what actor/actress do you know is in the movie?");

            text = actor;
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
            expect(res.sessionAttributes).to.have.property("Actor").to.equal(actor);

            text = "no";
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal('ElicitIntent');
            expect(res.message).to.equal('What else can you remember about the movie (actor, plot, quote) [Current information => Actor: "' + actor + '"]');
            expect(res.sessionAttributes).to.have.property("Actor").to.equal(actor);

            text = "find by quote";
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal('ElicitSlot');
            expect(res.message).to.equal("What quote is in the movie?");
            expect(res.sessionAttributes).to.have.property("Actor").to.equal(actor);

            text = quote;
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal('ConfirmIntent');
            expect(res.intentName).to.equal('ContinueFinding');
            expect(res.message).to.match(/^Hey! We found 1 matching movies\. .* Did we find your movie\(yes\/no to continue searching\)\?/);
            expect(res.sessionAttributes).to.have.property("Actor").to.equal(actor);
            expect(res.sessionAttributes).to.have.property("MovieQuote").to.equal(quote)

            text = "yes";
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal('Fulfilled');
            expect(res.message).to.equal('No problem, thank you for using the movie bot. Good bye');
            expect(res.sessionAttributes).to.be.empty;
        });
    });

});