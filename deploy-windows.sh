#!/bin/bash

echo running deployment script....
cd lambda
../zip.exe -r ../lambda.zip * # replace with just "zip" if using a mac
cd ..
if [ $1 = "prod" ]; then
    echo deploying to prod
    aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunctionProd
else
    echo deploying to dev
    aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunction
fi