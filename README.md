[![Build Status](https://travis-ci.org/WesleyYep/moviebot.svg?branch=master)](https://travis-ci.org/WesleyYep/moviebot)  
  
# moviebot
Chatbot for movies

## Initialisation

- create lambda functions in aws console called "moviebotFunction" - use empty nodejs 4.3 template or any lambda lex template
- lambda handler should be called "moviebotFunction.handler" for both dev and prod

## Requirements
- git bash (if using windows)
- node

## Deploying
- `aws lambda add-permission --function-name moviebotFunction --statement-id 1111 --action lambda:InvokeFunction --principal lex.amazonaws.com` to allow invoke function for lex - this only needs to be called once
- `sh lambda.sh`
- `sh lex.sh [save/deploy]`
- lex has the option to save (get config from AWS) or deploy (push config to AWS)
- lambda is deploy only - as it's easier to make changes locally anyway using an IDE (eg. VS code/sublime)
- slots used in moviebot must have a description starting with "moviebot" so that they can be detected as relevant
- IMPORTANT: make sure no other bots use the slots/intents used by moviebot

## Running workers
`nohup node movieWorker.js > err.out 2>&1 &`  
`nohup node wikipediaWorker.js > err.out 2>&1 &`