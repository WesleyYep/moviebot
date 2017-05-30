var http = require('http');

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

exports.handler = (event, context, callback) => {
  var apiKey = process.env.TMDB_KEY;

  //read slots
  var slots = event.currentIntent.slots

  Object.keys(slots).forEach(function(key, index){
    console.log(slots[key]);
  });

  //retrieve movie list for this actor
  if (slots.Actor !== null) {

    //first retrieve the person id
    var url = 'http://api.themoviedb.org/3/search/person?api_key=' + apiKey + '&language=en-US&query=' + slots.Actor;

    http.get(url, function (res) {
        
      res.on('data', function (chunk) {
        var jsonReponseObj = JSON.parse(chunk);
        var resultList = jsonReponseObj.results;

        for (index = 0; index< resultList.length; index++) {
          console.log(resultList[index].name);
        }

        if (jsonReponseObj.total_results == 1) {
          // just one actor/actoress matching perfect !
          callback(null,close({}, 'Fulfilled', {contentType: 'PlainText', content: 'The name of the actor/actress is ' + resultList[0].name}))
        } else if (jsonReponseObj.total_results > 1) {
          // multiple actors and actors return
          callback(null,close({}, 'Failed', {contentType: 'PlainText', content: 'Multiple actors and actors return'}))
        } else {
          // no actors and actress return
          callback(null,close({}, 'Failed', {contentType: 'PlainText', content: 'No actors and actress return'}))
        }  
      });
    }).on('error', function (err) {
      console.log('Error, with: ' + err.message);
      callback(err)
    });

  } else {
    callback(new Error("Actor/Actress name is not provided"))
  }
};
