go get github.com/otiai10/copy
go get -u github.com/iancoleman/strcase
go run create-dist.go || exit 1

npm i -g now@16 || exit 1
now --prod -A now-staging.json && now rm staging --safe --yes
rm -rf dist