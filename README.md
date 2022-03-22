# Asanaban

## Requirements
* npm
* vue-cli (```npm install -g @vue/cli ```)
* linter (```brew install golangci-lint```)

## Project setup
* Download the [.env](https://start.1password.com/open/i?a=7BICDIKH2ZHQZIH6N3APRMZKLU&v=zu4fcddpxze65mjtzpq6fcadim&i=4qxmcvqnezauxblqwo7hpzzlnu&h=team-swec.1password.ca) and put it in the project folder
* Run ```make get```
  * If there is an issue with installing Pinia, try using npm 7 (```nvm use 15```)

## Run Locally
```
make run
```
The app will be running on http://localhost:8080

## Run Tests
```
make tests
```
