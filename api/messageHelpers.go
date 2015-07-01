package api

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
)

func resendMessage(message *Message, err error) {
	log.Printf("Failed to send message : %v \n", err)
	message.Resend = true
	broadcast <- StreamData{
		Type: "MSG",
		Message: *message,
	}
}

func getChannelId(channelId uint) string {
	return fmt.Sprintf("channel%d", channelId)
}

func getJSONMessage (message *Message) (string, error) {
	jsonMessage, err := json.Marshal(*message)
		if err != nil{
			resendMessage(message, err)
			return "", err
		}
	return string(jsonMessage), nil
}

func (app *App) markAsRead(ack *Acknowledge){
	channelId, messageId := ack.ChannelId, ack.MessageId
	result, err := app.Cache.HGet(getChannelId(channelId), messageId).Result()
	if err != nil{
		app.logger(err)
		return
	}
	if len(result) != 0  {
		var message Message
		json.Unmarshal([]byte(result), &message)
		message.Read = true
		messageJson, _ := getJSONMessage(&message)
		_, err = app.Cache.HSet(getChannelId(channelId), messageId, messageJson).Result()
		if err != nil{
			app.logger(err)
		}
	}else {
		// Not in cache, must be in db
		result := app.Db.Model(&Message{ID: messageId}).Updates(Message{Received: true})
		if result.Error != nil{
			app.logger(result.Error)
		}
	}
}

func (app *App) markAsReceived(ack *Acknowledge){
	channelId, messageId := ack.ChannelId, ack.MessageId
	result, err := (* app.Cache).HGet(getChannelId(channelId), messageId).Result()
	if err != nil{
		log.Println(channelId, messageId)
		app.logger(err)
		return
	}
	if len(result) != 0  {
		var message Message
		json.Unmarshal([]byte(result), &message)
		message.Received = true
		messageJson, _ := getJSONMessage(&message)
		_, err = app.Cache.HSet(getChannelId(channelId), messageId, messageJson).Result()
		if err != nil{
			app.logger(err)
		}
	}else {
		// Not in cache, must be in db
		result := app.Db.Model(&Message{ID: messageId}).Updates(Message{Received: true})
		if result.Error != nil{
			app.logger(result.Error)
		}
	}
}

func (app *App) writeToDb(channelId uint){
	len, err := app.Cache.HLen(getChannelId(channelId)).Result()
	if err != nil {
		app.logger(err)
		return
	}
	qsize, err := strconv.Atoi(os.Getenv("CACHE_QUEUE_SIZE"))
	if err != nil {
		app.logger(err)
		return
	}
	if len < int64(qsize) {
		return 
	} 
	messagesData, err := app.Cache.HGetAll(getChannelId(channelId)).Result()
	if err != nil{
		app.logger(err)
		return
	}
	var messages []Message
	for _, value := range messagesData{
		var message Message
		json.Unmarshal([]byte(value), &message)
		messages = append(messages, message)
	}
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].CreatedAt.Before(messages[j].CreatedAt)
	})

	for ix, msg := range messages{
		if ix >= qsize/2{
			break
		}
		app.Cache.HDel(getChannelId(channelId), msg.ID)	
	}
	log.Println("Writing to db ...")
	result := app.Db.Create(messages[0:qsize/2])
	if result.Error != nil{
		app.logger(err)
	}
}
