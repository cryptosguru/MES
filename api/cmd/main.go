package main

import (
	"api"
	"fmt"
)

func main() {
	fmt.Println("Started server")
	fmt.Println("Dummy change to test github actions")
	app := &api.App{}
	app.Start()
}
