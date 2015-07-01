package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)


func (app *App) sendInternalServerError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Message: "Somthing went wrong",
		Data:    err.Error(),
	})
	app.logger(err)
}

