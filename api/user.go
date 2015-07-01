package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

func (app *App) getUser(c *gin.Context){
	userId := c.GetUint("userId")
	var user User
	result := app.Db.Select("username", "name", "email", "id", "createdAt", "about", "profilePic", "gender").Take(&user, User{ID: uint(userId)})
	if result.Error != nil {
		app.sendInternalServerError(c, result.Error)
		return
	}
	user.IsAuth = true
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "",
		Data: user,
	})
}

type searchRequest struct{
	Key string `json:"key"`
}

func (app *App) search(c *gin.Context){
	var request searchRequest
	var response []User
	c.ShouldBindBodyWith(&request, binding.JSON)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	tx.Model(&User{}).Select("username", "name", "id", "gender", "profilePic").Where("name LIKE ? OR username LIKE ?", request.Key, request.Key + "%").Find(&response)
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "",
		Data: response,
	})
}

type aboutRequest struct{
	About string `json:"about"`
}

func (app *App) updateAbout(c *gin.Context){
	var request aboutRequest
	response := User{ID : c.GetUint("userId")}
	c.ShouldBindBodyWith(&request, binding.JSON)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	result := tx.Model(&response).Updates(User{About: request.About})
	if result.Error != nil{
		app.logger(result.Error)
		app.sendInternalServerError(c, result.Error)
		return
	}
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Update successful",
		Data: nil,
	})
}

func (app *App) getProfilePic(c *gin.Context){
	c.File(c.Query("path"))
}

func (app *App) uploadProfilePic(c *gin.Context){
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		app.sendInternalServerError(c, err);
		return
	}
	os.MkdirAll("./profile", os.ModePerm)
	fileName := header.Filename
	ext := filepath.Ext(fileName)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		c.JSON(http.StatusUnprocessableEntity, Response{
			Success: false,
			Message: "Invallid file format",
			Data: nil,
		})
		return
	}
	// Delete if file exists
	userId := c.GetUint("userId")
	var user = User{ID: userId}
	app.Db.Select("profilePic").Take(&user, User{ID: userId})
	if user.ProfilePic != ""{
		os.Remove(user.ProfilePic)
	}

	newName := fmt.Sprintf("%s" + "%s", fmt.Sprint(userId), ext)
	out, err := os.Create("./profile/" + newName) 
	if err != nil {
		app.sendInternalServerError(c, err);
		return
	}
	defer out.Close()
	_, err = io.Copy(out, file)
	if err != nil {
		app.sendInternalServerError(c, err);
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	res := tx.Model(&user).Updates(User{ProfilePic: fmt.Sprintf("./profile/%s", newName)})
	fmt.Print(res.RowsAffected, res)
	if res.Error != nil{
		app.sendInternalServerError(c, res.Error)
		return
	}
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Upload successful",
		Data: user,
	})
}