package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"golang.org/x/crypto/bcrypt"
)

// REGISTER

type RegisterRequest struct {
	Name            string `json:"name" validate:"required,min=3,max=20"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6,max=20"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,eqfield=Password"`
	Username        string `json:"username" validate:"required,min=3,max=20"`
	Gender string `json:"gender" validate:"required,min=1,max=1"`
}

func (app *App) validateRegister(next gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request RegisterRequest
		if err := c.ShouldBindBodyWith(&request, binding.JSON); err != nil {
			app.sendInternalServerError(c, err)
		}
		err := app.Validate.Struct(request)
		if err != nil {
			app.sendValidationErrors(c, err)
			return
		}
		next(c)
	}
}

func (app *App) sendMail(newUser *User) {
	id, err := app.ShortId.Generate()
	if err != nil {
		log.Println("Couldn't generate short id", err)
		return
	}
	verify := Verification{ID: id, UserId: newUser.ID, ExpiresAt: time.Now().Add(time.Hour * 2)}
	result := app.Db.Create(&verify)
	if result.Error != nil {
		log.Println(result.Error)
		return
	}
	var (
		from            = os.Getenv("FROM_MAIL")
		password        = os.Getenv("MAIL_PASSWORD")
		host            = os.Getenv("MAIL_HOST")
		port     string = os.Getenv("MAIL_PORT")
		to              = []string{newUser.Email}
	)
	msg := fmt.Sprintf("Use this link to verify your account \nhttps://localhost:3000/verify?id=%s", verify.ID)
	mailBody := []byte("Subject: Email Verification" +
		"\r\n" +
		msg)
	auth := smtp.PlainAuth("", from, password, host)
	err = smtp.SendMail(fmt.Sprintf("%s:%s", host, port), auth, from, to, mailBody)
	if err != nil {
		log.Println("Mail could not be sent", err)
	}
}

func (app *App) register(c *gin.Context) {

	var request RegisterRequest
	if err := c.ShouldBindBodyWith(&request, binding.JSON); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Something went wrong",
			Data:    err.Error(),
		})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "",
			Data:    nil,
		})
		return
	}
	newUser := User{Name: request.Name, Email: request.Email, Password: string(hashedPassword), Username: request.Username, Gender: request.Gender}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	result := tx.Take(&User{}, User{Email: newUser.Email})
	if result.RowsAffected != 0 {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: fmt.Sprintf("The email %s already exists", newUser.Email),
			Data:    nil,
		})
		return
	}
	result = tx.Take(&User{}, User{Username: newUser.Username})
	if result.RowsAffected != 0 {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: fmt.Sprintf("The username %s already exists", newUser.Username),
			Data:    nil,
		})
		return
	}
	result = tx.Create(&newUser)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Message: "Something went wrong",
			Data:    result.Error,
		})
		app.logger(err)
		return
	}
	//go app.sendMail(&newUser)

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Verification mail sent!",
		Data:    newUser,
	})
}

// VERIFY

func (app *App) verify(c *gin.Context) {
	verify := Verification{ID: c.Query("id")}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	result := tx.Take(&verify, verify)
	if result.Error != nil {
		app.logger(result.Error)
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "Link does not exist or may have expired",
			Data:    nil})
		return
	}
	var user User
	tx.Select("id", "email", "isVerified").Take(&user, User{ID: verify.UserId})
	if user.IsVerified {
		c.JSON(http.StatusOK, Response{
			Success: true,
			Message: "User has already been verified",
			Data:    nil,
		})
		return
	}
	if verify.ExpiresAt.Before(time.Now()) {
		// Delete this link since new one has to be created
		tx.Delete(&verify)
		go app.sendMail(&user)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "This link has expired. A new link has been mailed to you",
			Data:    nil,
		})
		return
	}
	tx.Model(&user).Updates(User{IsVerified: true})
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Verified successfully",
		Data:    nil,
	})
}

// LOGIN

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6,max=20"`
}

func (app *App) validateLogin(next gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request LoginRequest
		if err := c.ShouldBindBodyWith(&request, binding.JSON); err != nil {
			app.sendInternalServerError(c, err)
			return
		}
		err := app.Validate.Struct(request)
		if err != nil {
			app.sendValidationErrors(c, err)
			return
		}
		next(c)
	}
}

func (app *App) login(c *gin.Context) {
	var user User
	if err := c.ShouldBindBodyWith(&user, binding.JSON); err != nil {
		app.sendInternalServerError(c, err)
		return
	}
	password := user.Password
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	result := tx.Select("id", "password", "isVerified").Take(&user, User{Email: user.Email})

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Message: "User not found",
			Data:    nil,
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Incorrect password",
			Data:    nil,
		})
		return
	}

	if !user.IsVerified {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Email verification pending",
			Data:    nil,
		})
		return
	}
	
	newSession := sessions.Default(c)
	newSession.Set("id", user.ID)
	newSession.Set("email", user.Email)
	newSession.Save()

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Successfully logged in",
		Data:    nil,
	})
}

// LOGOUT

func (app *App) logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Save()
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "User logged out successfully",
		Data:    User{IsAuth: false},
	})
}

func (app *App) withAuth(next gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		id := session.Get("id")
		if id == nil {
			c.JSON(http.StatusUnauthorized, Response{
				Success: false,
				Message: "Login required",
				Data:    User{IsAuth: false},
			})
			return
		}
		c.Set("userId", id)
		next(c)
	}
}
