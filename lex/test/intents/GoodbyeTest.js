var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("Goodbye Intent", function() {
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

    it("should return goodbye response and clear session attributes", function() {
        // GIVEN
        const text = "goodbye";
        lexHelper.logUser(text);

        // set timeout
        this.timeout(10000);

        const options = lexHelper.generateOptions(accessKey, secretKey, region);
        const userId = lexHelper.generateUserId();
        var lexruntime = new AWS.LexRuntime(options);

        const params = lexHelper.generateParams(botName, botAlias, userId, text);

        var result = lexruntime.postText(params).promise();

        // WHEN
        return result.then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal("Fulfilled");
            expect(res.message).to.equal("No problem, thank you for using the movie bot. Good bye");
            expect(res.sessionAttributes).to.be.empty;
        });
    });

});