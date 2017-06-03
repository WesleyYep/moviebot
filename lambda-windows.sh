#!/bin/bash

echo running lambda deployment script....
cd lambda
if [ "$1" = "mac" ]; then # save or deploy
	zip -r ../lambda.zip * # replace with just "zip" if using a mac
else
	../zip.exe -r ../lambda.zip * # replace with just "zip" if using a mac
fi
cd ..

echo deploying lambda to dev
aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunction