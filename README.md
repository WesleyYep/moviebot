# moviebot
Chatbot for movies

## Initialisation

- create lambda functions in aws console called "moviebotFunction" - use empty nodejs 4.3 template or any lambda lex template
- lambda handler should be called "moviebotFunction.handler" for both dev and prod

## Requirements
- git bash (if using windows)
- node

## Deploying
- `sh lambda-windows.sh`
- `sh lex-windows.sh [save/deploy]`
- lex has the option to save (get config from AWS) or deploy (push config to AWS)
- lambda is deploy only - as it's easier to make changes locally anyway using an IDE (eg. VS code/sublime)
- slots used in moviebot must have a description starting with "moviebot" so that they can be detected as relevant