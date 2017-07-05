var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("Help intent", function() {
    var botName, botAlias, accessKey, secretKey, region;

    const helpUtterances = [
        "help",
        "i need help",
        "help me"
    ];

    before("Initialise aws credentials", function() {
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

    helpUtterances.forEach((helpUtterance) => {
        it("should elicit intent with help message given help utterance \'" + helpUtterance + "\'", function() {
            // GIVEN
            var text = helpUtterance;
            lexHelper.logUser(text);

            // set timeout
            this.timeout(10000);

            const options = lexHelper.generateOptions(accessKey, secretKey, region);
            const userId = lexHelper.generateUserId();

            var lexruntime = new AWS.LexRuntime(options);

            var params = lexHelper.generateParams(botName, botAlias, userId, text);
            var result = lexruntime.postText(params).promise();

            // WHEN
            return result.then((res) => {
                // THEN
                lexHelper.logBot(res.message);
                expect(res.dialogState).to.equal('ElicitIntent');
                expect(res.message).to.equal('MovieBot currently supports search by plot, quote and actors. You can begin a search by telling MovieBot which search type to execute. e.g. find by actor');
            });
        });
    });

});