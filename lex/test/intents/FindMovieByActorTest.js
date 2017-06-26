var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("FindMovieByActor intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    const actors = [
        "Chris Evans",
        "Jim Carrey",
        "Tom Hanks"
    ];

    const openingUtterancesToElicitSlot = [
        "find by actor"
    ];

    before("Initialise http variables, signature and actors name", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();

    });

    beforeEach(function(done){
        this.timeout(2000);
        setTimeout(done, 1900);
    })

    openingUtterancesToElicitSlot.forEach((openingUtterance) => {
        actors.forEach((actor) => {
            it("should elicit slot given opening utterance \'" + openingUtterance + "\' and then return matching movies with actor \'" + actor + "\'", function() {
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
                    expect(res.message).to.match(/^Hey! We found [0-9]{1,2} matching movies\. .* Did we find your movie\? Or still unsure \?/);
                    expect(res).to.have.own.property('responseCard');
                });
            });
        });
    });

    it("should ask for the actor name again after giving an invalid actor name", function() {
        this.timeout(20000);

        var text = "filter by actor";
        lexHelper.logUser(text);

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

            text = "jim karrey";
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            lexHelper.logBot(res.message)
            expect(res.dialogState).to.equal("ElicitSlot");
            expect(res.message).to.equal("Found multiple actor. What is the name of the actor/actress ?");

            text = "jim carrey";
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