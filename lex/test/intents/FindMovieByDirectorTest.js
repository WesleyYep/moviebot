var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("FindMovieByDirector intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    const directors = [
        "Steven Spielberg",
        "George Lucas",
        "Alfred Hitchcock"
    ];

    const openingUtterancesToElicitSlot = [
        "find by director"
    ];

    before("Initialise http variables, signature and directors name", function() {
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
        directors.forEach((director) => {
            it("should elicit slot given opening utterance \'" + openingUtterance + "\' and then return matching movies with director \'" + director + "\'", function() {
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
                    expect(res.message).to.equal("Who is the director?");

                    text = director;
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

    it("should ask for the director name again after giving an invalid director name", function() {
        this.timeout(20000);

        var text = "filter by director";
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
            expect(res.message).to.equal("Who is the director?");

            text = "George lukas";
            lexHelper.logUser(text);
            params = lexHelper.generateParams(botName, botAlias, userId, text);

            return lexruntime.postText(params).promise();
        }).then((res) => {
            lexHelper.logBot(res.message)
            expect(res.dialogState).to.equal("ElicitSlot");
            expect(res.message).to.equal("Found multiple matching directors. Who is the director?");

            text = "George Lucas";
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