package api

import (
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

type ValidationError struct {
	Tag     string `json:"tag"`
	Message string `json:"message"`
	Field   string `json:"field"`
}

func (app *App) InitRoutes() {
	gin.SetMode(os.Getenv("GIN_MODE"))
	app.Router = gin.Default()
	app.Router.SetTrustedProxies(nil)
	app.Router.Use(gin.Recovery())
	app.Router.Use(sessions.Sessions("messagingAppSession", *app.Session))
	api := app.Router.Group("/api")

	auth := api.Group("/auth")
	{

		auth.POST("/register", app.validateRegister(app.register))
		auth.GET("/verify", app.verify)
		auth.POST("/login", app.validateLogin(app.login))
		auth.DELETE("/logout", app.logout)
	}
 
	api.GET("/user", app.withAuth(app.getUser))
	api.POST("/users/search", app.withAuth(app.search))
	api.PATCH("/user/about", app.withAuth(app.updateAbout))
	api.GET("/user/profile", app.withAuth(app.getProfilePic))
	api.POST("/user/profile", app.withAuth(app.uploadProfilePic))

	api.POST("/channel", app.withAuth(app.createChannel))
	api.GET("/channels", app.withAuth(app.getUserChannels))
	api.GET("/channel/:id/", app.withAuth(app.getChannel))
	api.DELETE("/channel", app.withAuth(app.deleteChannel))

	// TODO: TLS required for wss, ws doesn't work on chrome
	api.GET("/chat", app.withAuth(app.handleConnection))
	
	// Need to change to RunTLS
	app.Router.Run(":5000")
}
