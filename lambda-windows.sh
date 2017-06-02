#!/bin/bash

echo running lambda deployment script....
cd lambda
../zip.exe -r ../lambda.zip * # replace with just "zip" if using a mac
cd ..

echo deploying lambda to dev
aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunction