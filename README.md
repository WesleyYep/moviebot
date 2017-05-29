# moviebot
Chatbot for movies

## Initialisation

- create lambda functions in aws console called "moviebotFunction" and "moviebotFunctionProd" - use empty nodejs 4.3 template or any lambda lex template
- lambda handler should be called "moviebotFunction.handler" for both dev and prod

## Requirements
- git bash (if using windows)
- node

## Deploying
- `sh lambda-deploy-windows.sh [dev/prod]`
- `sh lex-deploy-windows.sh [dev/prod] [init]`
- use "init" parameter when deploying a lex bot for the first time to either dev or prod
