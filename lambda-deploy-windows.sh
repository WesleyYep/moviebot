#!/bin/bash

echo running lambda deployment script....
cd lambda
../zip.exe -r ../lambda.zip * # replace with just "zip" if using a mac
cd ..
if [ "$1" = "prod" ]; then
    echo deploying lambda to prod
    aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunctionProd
else
    echo deploying lambda to dev
    aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunction
fi