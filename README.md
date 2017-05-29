# moviebot
Chatbot for movies

## Initialisation

- create lambda functions called moviebotFunction and moviebotFunctionProd (nodejs 4.3)
- create lex bots called MovieBot and MovieBotProd
- `sh deploy-windows.sh [dev/prod]`
- `aws lex-models get-bot --name MovieBot --version-or-alias "\$LATEST"`
