FROM node:lts-alpine3.12 as npm-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

# golang:1.18-alpine on Mar 24, 2022
FROM golang@sha256:b64a34e943993228a0402595bdfec53a421efaf4aff38938d179e54cdd475a76

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
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-w -s -extldflags "-static"' -a -buildvcs=false -o ./main .

USER appuser:appuser
WORKDIR $GOPATH/src/searchspring/asanaban/

# Run the main binary
ENTRYPOINT ./main