[![Build Status](https://travis-ci.org/WesleyYep/moviebot.svg?branch=master)](https://travis-ci.org/WesleyYep/moviebot)  
  
# moviebot
Chatbot for movies

## Summary
MovieBot is a chatbot program which allows users to find the name of movies they can’t remember. It is targeted to individuals which remember aspects about the movie such as plot or actor/actress in the movie but can’t remember the movie title. MovieBot works by asking users to state information they know about the movie and then displays possible matching movie titles. More information given to MovieBot will refine the search.  
Currently MovieBot supports the following information:  
* Find by quote  
* Find by actor/actress  
* Find by director  
* Find by plot  
* Find by year  

The results are shown to the user along with a link to the movie trailer.  


## Features  
MovieBot allows users to find movie titles they can't remember. It currently supports the below functionality through interacting with the chatbot. The chatbot responds accordingly based on certain utterances.  

### Welcome  
```
User: Hello
Bot: Hi I'm moviebot. I find movies that you can't remember. Currently we can search by plot, quote, actors, year, and director. Which of these could you remember?
```

### Actor  
Movie titles can be searched by informing chatbot about the actor/actress in the movie. The actor query is searched against ElasticSearch and returns relevant movies.  

```
User: find by actor
Bot: sure what actor/actress do you know is in the movie?
User: jim carrey
Bot: Hey! We found 40 matching movies. The first movie was called Eternal Sunshine of the Spotless Mind. Did we find your movie(yes/no to continue searching)?
```

#### Actor Suggestion  
```
User: find by actor
Bot: sure what actor/actress do you know is in the movie?
User: kim carrey
Bot: Found multiple matching actor/actress. What is the name of the actor/actress ?
User: jim carrey
Bot: Hey! We found 40 matching movies. The first movie was called Eternal Sunshine of the Spotless Mind. Did we find your movie(yes/no to continue searching)?
```

### Quote  
Movie titles can be searched by quote. The quote query is searched against WikiQuote api. As quote queries may not be exact match, the api call uses a fuzzy search to retrieve closest matching movies.

```
User: find by quote
Bot: What quote is in the movie?
User: you either die a hero or you live long enough to become the villain
Bot: Hey! We found 3 matching movies. The first movie was called The Dark Knight. Did we find your movie(yes/no to continue searching)?
```

### Director  
Movie titles can be searched by director. The director query is searched against ElasticSearch and returns relevant movies.

```
User: find by director
Bot: Who is the director?
User: Steven Spielberg
Bot: Hey! We found 50 matching movies. The first movie was called Indiana Jones and the Temple of Doom. Did we find your movie(yes/no to continue searching)?
```

#### Director Suggestion
```
User: find by director
Bot: Who is the director?
User: Sten Spielberg
Bot: Found multiple matching directors. Who is the director?
User: Steven Spielberg
Bot: Hey! We found 50 matching movies. The first movie was called Indiana Jones and the Temple of Doom. Did we find your movie(yes/no to continue searching)?
```

### Plot  
Movie titles can be searched by plot. The plot query is searched against Google custom search api.  

```
User: find by plot
Bot: What is the plot of the movie ?
User: apes riding in horses taking over the world
Bot: Hey! We found 4 matching movies. The first movie was called Rise of the Planet of the Apes. Did we find your movie(yes/no to continue searching)?
```

### Year
Movies can be searched by the release year

```
Users: find by year
Bot: What year was the movie released?
User: the movie was release in 2011
Bot: Hey! We found 30 matching movies. The first movie was called Pirates of the Caribbean: On Stranger Tides. Did we find your movie(yes/no to continue searching)?
```

### Combination Query
You can also combined different information together to narrow down the result and find the movie you are looking for

```
User: hello moviebot
Bot: Hi I'm moviebot. I find movies that you can't remember. Currently we can search by plot, quote, actors, year, and director. Which of these could you remember?
User: one of the actors is chris hemsworth
Bot: Hey! We found 17 matching movies. The first movie was called The Avengers. Did we find your movie(yes/no to continue searching)? [There are response cards with movie title and movie trailer]
User: no
Bot: What else can you remember about the movie (actor, plot, quote, year, director) [Current information => Actor: "chris hemsworth"]. You can say "clear current information" to clear current information
User: the year was 2012
Bot: Hey! We found 4 matching movies. The first movie was called The Avengers. Did we find your movie(yes/no to continue searching)?
```

### Help  
```
User: help
Bot: MovieBot currently supports search by plot, quote, actors, year, and director. You can begin a search by telling MovieBot which search type to execute. e.g. find by actor
```

### Clear current information
```
User: clear current information
Bot: Current information cleared. What can you remember about the movie (actor, plot ,quote, year, director) [Current information => ]
```

### Goodbye  
```
User: goodbye
Bot: No problem, thank you for using the movie bot. Good bye
```

## Developer Section
### Initialisation

- create lambda functions in aws console called "moviebotFunction" - use empty nodejs 4.3 template or any lambda lex template
- lambda handler should be called "moviebotFunction.handler" for both dev and prod

### Requirements
- git bash (if using windows)
- node

### Deploying
- `aws lambda add-permission --function-name moviebotFunction --statement-id 1111 --action lambda:InvokeFunction --principal lex.amazonaws.com` to allow invoke function for lex - this only needs to be called once
- `sh lambda.sh`
- `sh lex.sh [save/deploy]`
- lex has the option to save (get config from AWS) or deploy (push config to AWS)
- lambda is deploy only - as it's easier to make changes locally anyway using an IDE (eg. VS code/sublime)
- slots used in moviebot must have a description starting with "moviebot" so that they can be detected as relevant
- IMPORTANT: make sure no other bots use the slots/intents used by moviebot

### Running workers
`nohup node movieWorker.js > err.out 2>&1 &`  
`nohup node wikipediaWorker.js > err.out 2>&1 &`
