package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)


var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {return true}}

var channelMap = make(map[uint] []receiver) // ChannelID to receivers 
var broadcast = make(chan StreamData )
// For notification to users (like when new channel is created)
var userMap = make(map[uint] *websocket.Conn) // UserID to wewbsocket connection

type receiver struct{
	UserId uint
	Connection *websocket.Conn
}


func (app *App) handleConnection(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		app.logger(err)
	}
	
	var channels []Channel
	userId := c.GetUint("userId")
	err = app.Db.Model(&User{ID: userId}).Select("id").Association("Channels").Find(&channels)
	if err != nil{
		app.logger(err)
	}
	for _, channel := range channels{
		channelMap[channel.ID] = append(channelMap[channel.ID], receiver{UserId: userId, Connection: ws})
	} 
	userMap[userId] = ws
	log.Printf("New connection %d\n", userId)
	ws.SetCloseHandler(func(code int, text string) error {
		log.Printf("Received close message: %d %s\n", code, text)
		// Delete ws from user id to connection mapping
		delete(userMap, userId)
		for _, channel := range channels{
			var idx int
			// Delete current connection from array corresponding to channel
			for i, receiver := range channelMap[channel.ID]{
				if receiver.Connection == ws{
					idx = i
					break
				}
			}
			n := len(channelMap[channel.ID])
			// If channel has just one receiver, delete channel from map
			if n==1{
				delete(channelMap, channel.ID)
				continue
			}
			channelMap[channel.ID][idx] = channelMap[channel.ID][n-1]
			channelMap[channel.ID] = channelMap[channel.ID][0 : n-1]
			
		} 
		return ws.Close()
	})

	go app.listenForMessages(ws, userId)
} 

func (app *App) listenForMessages(ws *websocket.Conn, userId uint){
	// Receive messages (this for loop receives messages over one connection only, i.e, per client there is one for loop)
	for 
	{
		var streamData StreamData
		messageType, msg, _ := ws.ReadMessage()
		if messageType >= 1000{
			break
		}
		err := json.Unmarshal(msg, &streamData)
		if err != nil{
			break
		}
		if streamData.Type == "ACK" {
			broadcast<- streamData
			if streamData.Acknowledge.AckType == "READ"{
				app.markAsRead(&streamData.Acknowledge)
			}else if streamData.Acknowledge.AckType == "RECEIVED"{
				app.markAsReceived(&streamData.Acknowledge)
			}
			continue
		}
		message := streamData.Message
		message.SenderId = userId
		message.Connection = ws
		message.Resend = false
		message.CreatedAt = time.Now()

		message.ID, err = app.ShortId.Generate()
		if err != nil{
			resendMessage(&message, err)
			break
		} 

		message.Sent = true
		jsonMessage, err := getJSONMessage(&message)
		if err != nil{
			break
		}

		// Insert message into list of messages
		result := app.Cache.HSet(fmt.Sprintf("channel%d", message.ChannelId), message.ID, jsonMessage)
		_, err = result.Result()
		if err != nil{
			resendMessage(&message, err)
			break
		}
		if(message.IsNewChannel){
			channelMap[message.ChannelId] = append(channelMap[message.ChannelId], receiver{UserId: message.SenderId, Connection: message.Connection})
			app.newChannelMessage(StreamData{
				Type: "MSG",
				Message: message,
			})	
		}else{
			broadcast <- StreamData{
				Type: "MSG",
				Message: message,
			}
		}
		broadcast <- StreamData{
			Type: "ACK",
			Acknowledge: Acknowledge{
				AckType: "SENT",
				MessageId: message.ID,
				FrontendId: message.FrontendId,
				SenderId: message.SenderId,
				ChannelId: message.ChannelId,
				CreatedAt: message.CreatedAt,
			},
		}

		go app.writeToDb(message.ChannelId)
	}
	ws.Close()
}

func (app *App) SendData(){
	log.Println("Listening")
	// Type = MSG
	// Runs for all connections
	for {
		streamData, ok := <-broadcast
		if !ok{
			break
		}
		switch streamData.Type{
		case "ACK":
			app.sendAcks(streamData)
		case "MSG":
			app.sendMessages(streamData)
		}
	}
}

func (app *App) sendMessages(streamData StreamData){
	channelId := streamData.Message.ChannelId
	for _, receiver := range channelMap[channelId] {
		if streamData.Message.SenderId == receiver.UserId{
			continue
		}
		err := receiver.Connection.WriteJSON(streamData)
		if err != nil{
			app.logger(err)
		}
	}
}

func (app *App) sendAcks(streamData StreamData) {
	channelId := streamData.Acknowledge.ChannelId
	for _, receiver := range channelMap[channelId]{
		if (streamData.Acknowledge.SenderId != receiver.UserId){
			continue
		}
		err := receiver.Connection.WriteJSON(streamData)
		if err != nil{
			app.logger(err)
		}
	}
}

func (app *App) newChannelMessage(streamData StreamData) {
	var users []User
	err := app.Db.Model(&Channel{ID: streamData.Message.ChannelId}).Select("id").Association("Members").Find(&users)
	if(err != nil){
		app.logger(err)
		return
	}
	// For each user that's not the sender, add the ws connection to channelMap
	for _, user := range users{
		if(user.ID != streamData.Message.SenderId){
			if(userMap[user.ID] == nil){
				continue
			}
			channelMap[streamData.Message.ChannelId] = append(channelMap[streamData.Message.ChannelId], receiver{UserId: user.ID, Connection: userMap[user.ID]})
		}
	}
	broadcast <- streamData
}