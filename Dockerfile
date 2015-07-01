FROM golang:1.10

WORKDIR /messagingApp

COPY . .

RUN ["go", "get", "github.com/githubnemo/CompileDaemon"]

ENTRYPOINT CompileDaemon -log-prefix=false -build="go build ./api/cmd/" -command="./cmd"

#~/go/bin/CompileDaemon -log-prefix=false -build="go build ./api/cmd/" -command="./cmd"