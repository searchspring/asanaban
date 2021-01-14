go get 
go run create-dist.go || exit 1
vercel --prod && vercel rm asanaban --safe --yes
rm -rf dist