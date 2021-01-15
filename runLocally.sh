go run create-dist.go
docker build -t asanaban:dev .
docker run --name asanaban -p 8080:80 --rm -d asanaban:dev

# this is for mac
open http://localhost:8080/index.html