package api

import (
	"net/http"
	"reflect"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func (app *App) InitValidator() {
	validate := validator.New()
	validate.RegisterStructValidation(usernameValidation, RegisterRequest{})
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
	app.Validate = validate
}

func usernameValidation(s validator.StructLevel){
	request := s.Current().Interface().(RegisterRequest)
	match, _ := regexp.Match("[a-zA-Z0-9_.]", []byte(request.Username))
	if !match {
		s.ReportError(request.Username, "username", "Username", "regex", "")
	}
}

func (app *App) sendValidationErrors(c *gin.Context, err error) {
	var validationErrors []ValidationError
	for _, err := range err.(validator.ValidationErrors) {
		validationErrors = append(validationErrors, ValidationError{Field: err.Field(), Tag: err.Tag(), Message: err.Error()})
	}
	c.JSON(http.StatusUnprocessableEntity, Response{
		Success: false,
		Message: "Validation error",
		Data:    validationErrors,
	})
}
