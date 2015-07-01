FROM golang:alpine3.15

WORKDIR /go/src/github.com/T3jasH/messagingApp/api 

COPY . .

RUN ["go", "get", "github.com/githubnemo/CompileDaemon"]

RUN ["go", "get", "./"]
	
EXPOSE 5000

ENTRYPOINT CompileDaemon -log-prefix=false -build="go build ./cmd/main.go" -command="./main"