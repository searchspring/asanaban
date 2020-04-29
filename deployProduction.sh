go get 
go run create-dist.go || exit 1
now --prod && now rm asanaban --safe --yes
rm -rf dist