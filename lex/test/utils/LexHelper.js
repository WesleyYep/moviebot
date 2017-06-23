var uuidv1 = require('uuid/v1');

const LEX_ENDPOINT = 'https://runtime.lex.us-east-1.amazonaws.com';

class AwsCredentials {
    constructor(accessKey, secretKey, region, botName, botAlias) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.region = region;
        this.botName = botName;
        this.botAlias = botAlias;
    }

    getAccessKey() {
        return this.accessKey;
    }

    getSecretKey() {
        return this.secretKey;
    }

    getRegion() {
        return this.region;
    }

    getBotName() {
        return this.botName;
    }

    getBotAlias() {
        return this.botAlias;
    }

}

/**
 * Retrieves aws credentials by inspecting environment variables.
 * Expected environment variables include:
 * AWS_ACCESS_KEY_ID
 * AWS_SECRET_ACCESS_KEY
 * AWS_DEFAULT_REGION
 * AWS_BOT_NAME
 * AWS_BOT_ALIAS
 */
var getAwsCredentials = function() {
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_DEFAULT_REGION;
    const botName = process.env.AWS_BOT_NAME;
    const botAlias = process.env.AWS_BOT_ALIAS;

    if (accessKey && secretKey && region && botName && botAlias) {
        return new AwsCredentials(accessKey, secretKey, region, botName, botAlias);
    } else {
        throw new Error("Unable to retrieve aws credentials. Please make sure environment variables are set");
    }
};

var generateUserId = function() {
    return uuidv1();
};

var generateOptions = function(accessKey, secretKey, region) {
    return {
        endpoint: LEX_ENDPOINT,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region
    };
};

var generateParams = function(botName, botAlias, userId, inputText, sessionAttributes = undefined) {
    var params = {
        botName: botName,
        botAlias: botAlias,
        inputText: inputText,
        userId: userId
    };

    if (sessionAttributes) {
        params.sessionAttributes = sessionAttributes;
    }

    return params;
};

var logUser = function(text) {
    console.log("User: " + text);
};

var logBot = function(text) {
    console.log("Bot: " + text);
};

module.exports = {
    getAwsCredentials: getAwsCredentials,
    generateUserId: generateUserId,
    generateOptions: generateOptions,
    generateParams: generateParams,
    logUser: logUser,
    logBot: logBot
};