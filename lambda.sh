#!/bin/bash

echo running lambda deployment script....
cd lambda
npm install
os=$(uname)
if [ $os = "Darwin" -o $os = "Linux" ]; then # save or deploy
	zip -r ../lambda.zip * # replace with just "zip" if using a mac
else
	../zip.exe -r ../lambda.zip * # replace with just "zip" if using a mac
fi
cd ..

echo deploying lambda to dev
echo ======== PLEASE ENSURE NEW SLOTS HAVE DESCRIPTION=moviebot ========
aws lambda update-function-code --zip-file fileb://lambda.zip --function-name moviebotFunction