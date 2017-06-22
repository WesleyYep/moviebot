var chai = require('chai');
var expect = chai.expect;
var lexHelper = require('../utils/LexHelper');
var AWS = require('aws-sdk');

describe("Welcome Intent", function() {

    var botName, botAlias, accessKey, secretKey, region;

    before("Initialise http variables and signature", function() {
        const awsCredentials = lexHelper.getAwsCredentials();
        accessKey = awsCredentials.getAccessKey();
        secretKey = awsCredentials.getSecretKey();
        region = awsCredentials.getRegion();
        botName = awsCredentials.getBotName();
        botAlias = awsCredentials.getBotAlias();
    });

    it("should return welcome response", function() {
        // GIVEN
        const text = "Hello";
        lexHelper.logUser(text);

        // set timeout
        this.timeout(10000);

        const options = lexHelper.generateOptions(accessKey, secretKey, region);
        var lexruntime = new AWS.LexRuntime(options);

        const params = lexHelper.generateParams(botName, botAlias, text);

        var result = lexruntime.postText(params).promise();

        // WHEN
        return result.then((res) => {
            // THEN
            lexHelper.logBot(res.message);
            expect(res.dialogState).to.equal('ElicitIntent');
            expect(res.message).to.equal("Hi I'm moviebot. I find movies that you can't remember. What can you remember about a particular movie?");
        });
    });

});