FROM node:lts-alpine3.12 as npm-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

# golang:alpine on Feb 23, 2022
FROM golang@sha256:d030a987c28ca403007a69af28ba419fca00fc15f08e7801fc8edee77c00b8ee

# Create appuser
ENV USER=appuser
ENV UID=10001

# See https://stackoverflow.com/a/55757473/12429735
RUN adduser \
    --disabled-password \
    --gecos "" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    "${USER}"

WORKDIR $GOPATH/src/searchspring/asanaban/
COPY --chown=appuser:appuser . .
COPY --from=npm-builder --chown=appuser:appuser /app/dist/ $GOPATH/src/searchspring/asanaban/public/
RUN chown -R appuser:appuser $GOPATH/src/searchspring/asanaban

# Fetch dependencies.
RUN go get -d -v

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-w -s -extldflags "-static"' -a -o ./main .

USER appuser:appuser
WORKDIR $GOPATH/src/searchspring/asanaban/

# Run the main binary
ENTRYPOINT ./main