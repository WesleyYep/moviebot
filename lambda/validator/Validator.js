var SlotConstants = require('../model/Slots');
var wikiQuoteSource = require('../source/WikiQuoteSource');
var elasticSource = require('../source/ElasticSource');

var validate = function(queryInfo) {
    const slots = queryInfo['slots'];
    const sessionAttributes = queryInfo['sessionAttributes'];

    //validate depending on the intent
    var validationResult = {
        isValid : true,
        incorrectSlotName : "",
        reason: "",
        suggestions : []
    }

    return new Promise(function(resolve, reject) {
        if (queryInfo["intentName"] == "FindMovieByActor") {
            const actorName =  slots[SlotConstants.MOVIE_ACTOR];
            
            var body = {
                "query" : {
                    "bool" : {
                        "should" : [
                            {
                                "match" : {
                                    "actorName" : {
                                        "query": actorName,
                                        "fuzziness": "2",
                                        "max_expansions": 100
                                    }
                                }
                                
                            }
                        ]
                    }
                }
            }

            elasticSource.query(body, "actors", "actor").then((responseBody) => {
                console.log(responseBody);                
                var jsonResponseBody = JSON.parse(responseBody);
                if (jsonResponseBody.hits.total == 0) {
                    validationResult.isValid = false;
                    validationResult.incorrectSlotName = SlotConstants.MOVIE_ACTOR;
                    validationResult.reason = "Could not find any matching actor/actress";
                    resolve(validationResult)
                    return
                }

                var results = jsonResponseBody.hits.hits
                var nameMap = {}

                for (i = 0; i<results.length; i++) {
                    var targetName = results[i]._source.actorName;
                    nameMap[targetName] = nameMap.hasOwnProperty(targetName) ? nameMap[targetName]++ : 1;
                    if (actorName.toLowerCase() === targetName.toLowerCase()) {
                        resolve(validationResult)
                        return
                    }
                }

                validationResult.isValid = false;
                validationResult.incorrectSlotName = SlotConstants.MOVIE_ACTOR;
                validationResult.reason = "Found multiple matching actor/actress";
                for (var key in nameMap) {
                    validationResult.suggestions.push(key);
                }

                resolve(validationResult)
            }).catch((err) => {
                reject(err);
            })
        } else if (queryInfo["intentName"] == "FindMovieByDirector") {
            const directorName =  slots[SlotConstants.MOVIE_DIRECTOR];
            
            var body = {
                "query" : {
                    "bool" : {
                        "should" : [
                            {
                                "match" : {
                                    "directorName" : {
                                        "query": directorName,
                                        "fuzziness": "2",
                                        "max_expansions": 100
                                    }
                                }
                                
                            }
                        ]
                    }
                }
            }

            elasticSource.query(body, "directors-v6", "director").then((responseBody) => {
                console.log(responseBody);
                var jsonResponseBody = JSON.parse(responseBody);
                if (jsonResponseBody.hits.total == 0) {
                    validationResult.isValid = false;
                    validationResult.incorrectSlotName = SlotConstants.MOVIE_DIRECTOR;
                    validationResult.reason = "Could not find any matching directors";
                    resolve(validationResult)
                    return
                }

                var results = jsonResponseBody.hits.hits
                var nameMap = {}

                for (i = 0; i<results.length; i++) {
                    var targetName = results[i]._source.directorName;
                    nameMap[targetName] = nameMap.hasOwnProperty(targetName) ? nameMap[targetName]++ : 1;
                    if (directorName.toLowerCase() === targetName.toLowerCase()) {
                        resolve(validationResult)
                        return
                    }
                }

                validationResult.isValid = false;
                validationResult.incorrectSlotName = SlotConstants.MOVIE_DIRECTOR;
                validationResult.reason = "Found multiple matching directors";
                for (var key in nameMap) {
                    validationResult.suggestions.push(key);
                }

                resolve(validationResult)
            }).catch((err) => {
                reject(err);
            })
        } else {
            resolve(validationResult)
        }
    });
};

module.exports = {
    validate: validate
};