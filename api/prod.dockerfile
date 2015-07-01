FROM golang:alpine3.15

WORKDIR /go/src/github.com/T3jasH/messagingApp/api 

COPY ./main .

EXPOSE 5000

ENTRYPOINT ./main