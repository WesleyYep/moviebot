# Running the test
`npm test`

# Setup
## Lex Setup
The testing requires an **alias** to exist for a bot. If you haven't already created an alias for a bot, create one and note it down. Example could be an alias called *Testing*.
## Environment Variables
The tests needs to extract aws credentials to communicate with lex-runtime. The following **environment variables** are required:  

* **AWS\_ACCESS\_KEY\_ID** = [Your aws access key]
* **AWS\_SECRET\_ACCESS\_KEY** = [Your aws secret key]
* **AWS\_DEFAULT\_REGION** = [Your aws default region]
* **AWS\_BOT\_NAME** = [Your bot name i.e. MovieBot]
* **AWS\_BOT\_ALIAS** = [Your bot alias i.e. Testing]