var http = require('http');

function handleSearchPersonSuccResponse(chunk) {
  var jsonReponseObj = JSON.parse(chunk);
  var resultList = jsonReponseObj.results;

  for (index = 0; index< resultList.length; index++) {
    console.log(resultList[index].name);
  }

  if (jsonReponseObj.total_results == 1) {
    // just one actor/actoress matching perfect !
  } else if (jsonReponseObj.total_result > 1) {
    // multiple actors and actors return
  } else {
    // no actors and actress return
  }  
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
        
      res.on('data', handleSearchPersonSuccResponse);

      context.done(null);
    }).on('error', function (err) {
      console.log('Error, with: ' + err.message);
      context.done("Failed");
    });

  } else {
    callback(new Error("Actor/Actress name is not provided"))
  }
};
