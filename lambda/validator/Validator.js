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
                        "must" : [
                            {"match" : {"actors" : actorName}}
                        ]
                    }
                },
                "highlight" : {
                    "pre_tags" : [""],
                    "post_tags" : [""],
                    "fields" : {
                        "actors" : {}
                    }
                }
            }

            elasticSource.query(body).then((responseBody) => {
                var jsonResponseBody = JSON.parse(responseBody);
                if (jsonResponseBody.hits.total == 0) {
                    validationResult.isValid = false;
                    validationResult.incorrectSlotName = SlotConstants.MOVIE_ACTOR;
                    validationResult.reason = "Could not find any actor";
                    resolve(validationResult)
                    return
                }

                var results = jsonResponseBody.hits.hits
                var nameMap = {}
                //check the first movie if there is an exact match of the actor name
                for(i = 0; i< results[0].highlight.actors.length; i++) {
                    var targetName = results[0].highlight.actors[i];
                    
                    nameMap[targetName] = nameMap.hasOwnProperty(targetName) ? nameMap[targetName]++ : 1;

                    if (actorName.toLowerCase() === targetName.toLowerCase()) {
                        resolve(validationResult)
                        return
                    }
                }

                //none of the name from first movie match correctly so gather all the similar name and return as suggestions
                for (i = 1; i<results.length; i++) {
                    for (j = 0; j<results[i].highlight.actors.length; j++) {
                        var targetName = results[i].highlight.actors[j];
                        nameMap[targetName] = nameMap.hasOwnProperty(targetName) ? nameMap[targetName]++ : 1;
                    }
                }

                validationResult.isValid = false;
                validationResult.incorrectSlotName = SlotConstants.MOVIE_ACTOR;
                validationResult.reason = "Found multiple actor";
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