package api

import (
	"log"
	"os"

	"runtime/debug"

	"github.com/gin-contrib/sessions/redis"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	goredis "github.com/go-redis/redis"
	"github.com/joho/godotenv"
	"github.com/teris-io/shortid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	_ "gorm.io/gorm/schema"
)

type App struct {
	Db       *gorm.DB
	Validate *validator.Validate
	Router   *gin.Engine
	ShortId  *shortid.Shortid
	Session  *redis.Store
	Cache *goredis.Client
}

func (app *App) connectToDB() {
	err := godotenv.Load("./.env")
	if err != nil {
		app.logger(err)
	}
	db, err := gorm.Open(postgres.Open(os.Getenv("DB_STRING")), &gorm.Config{})
	if err != nil {
		app.logger(err)

	}
	db.AutoMigrate(&User{}, &Verification{}, &Message{}, &Channel{})
	app.Db = db
}

func (app *App) initSession() {
	store, _ := redis.NewStore(10, "tcp", os.Getenv("REDIS_ADDR"), "", []byte(os.Getenv("SESSION_SECRET")))
	app.Session = &store
}

func (app *App) initCache(){
	client := goredis.NewClient(&goredis.Options{Addr: os.Getenv("REDIS_ADDR")})
	app.Cache = client
}

func (app *App) initShortID() {
	sid, err := shortid.New(1, shortid.DefaultABC, 42)
	if err != nil {
		app.logger(err)
	}
	app.ShortId = sid
}

func (app *App) logger(e error){
	log.Print(e)
	debug.PrintStack()
}

func (app *App) Start() {
	go app.SendData()
	app.connectToDB()
	app.initSession()
	app.initCache()
	app.InitValidator()
	app.initShortID()
	app.InitRoutes()
}
