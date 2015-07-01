package main

import (
	"api"
	"fmt"
)

func main() {
	fmt.Println("Started server")
	app := &api.App{}
	app.Start()
}
