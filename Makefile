ifneq (,$(wildcard ./.env))
    include .env
    export
	ENV_FILE_PARAM=--env-file .env
endif

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
HASH := $(shell git rev-parse HEAD)
LOCALKUBE := "true"

get:
	go get -t -v
	go get github.com/joho/godotenv/cmd/godotenv # This lets you run godotenv from the cli
	npm install
.PHONY: get

test-ci:
	go test -covermode=count -coverprofile=coverage.out ./...
.PHONY: test

build:
	go build -v ./...
.PHONY: build

lint:
	golangci-lint run -v
.PHONY: lint

test:
	$(HOME)/go/bin/gotest -coverprofile=cover.out ./...
.PHONY: test

cover:
	go tool cover -html=cover.out
.PHONY: cover

run:
	npm run serve &
	if go run . ; then \
		echo "API graceful exit" ; \
	else \
		echo "API threw an error, killing Vue process if it was running" ; \
		pgrep -f "$(pwd).*vue-cli" | xargs kill ; \
	fi 
.PHONY: run

fmt:
	gofmt -s -w .
.PHONY: fmt

docker-build:
	test $(VERSION) # Require VERSION to be specified: make docker-build VERSION=v1.0
	DOCKER_CONTENT_TRUST=1 && docker build -f Dockerfile -t asanaban -t asanaban:${VERSION} --build-arg VERSION=${VERSION} --build-arg COMMIT=${HASH} .
.PHONY: docker-build

docker-run:
	docker run --rm -p ${HTTP_PORT}:${HTTP_PORT} $(ENV_FILE_PARAM) asanaban:latest 
.PHONY: docker-run
