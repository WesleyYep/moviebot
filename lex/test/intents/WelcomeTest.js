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

    beforeEach(function(done){
        this.timeout(2000);
        setTimeout(done, 1900);
    })

    it("should return welcome response", function() {
        // GIVEN
        const text = "Hello";
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
            expect(res.dialogState).to.equal('ElicitIntent');
            expect(res.message).to.equal("Hi I'm moviebot. I find movies that you can't remember. Currently we can search by plot, quote, actors, year, and director. Which of these could you remember?");
        });
    });

});