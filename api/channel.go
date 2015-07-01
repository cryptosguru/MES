package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

func commonChannel (channels1 *[]Channel, channels2 *[]Channel) bool{
	var chMap = make(map[uint]bool)
	for _, ch := range *channels1{
		chMap[ch.ID] = true
	}
	for _, ch := range *channels2{
		if _, ok := chMap[ch.ID]; ok{
			return true
		}
	}
	return false
}

type createChannelRequest struct{
	IsGroup bool `json:"isGroup"`
	MemberIds []uint `json:"memberIds"`
}

func (app *App) createChannel(c *gin.Context){
	var request createChannelRequest
	c.ShouldBindBodyWith(&request, binding.JSON)
	if !request.IsGroup && len(request.MemberIds) != 2{
		c.JSON(http.StatusUnprocessableEntity, Response{
			Success: false,
			Message: "This channel can have only 2 members",
		})
		return
	}
	
	var newChannel Channel
	var members []*User
	// Check if sender id is present in memberIDs list
	senderId := c.GetUint("userId")
	found := false
	for _, id := range request.MemberIds{
		if id == senderId{
			found = true
		}
		members = append(members, &User{ID: id})
	}
	if !found{
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "You need be a part of the channel",
		})
		return
	}
	newChannel.Members = members
	ctx,cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()
	tx := app.Db.WithContext(ctx)
	if request.IsGroup{
		res := tx.Create(&newChannel)
		if res.Error != nil{
			app.sendInternalServerError(c, res.Error)
			return
		}
		c.JSON(http.StatusCreated, Response{
			Success: true,
			Message: "New channel created",
			Data: newChannel,
		})	
		return
	}
	var channels1, channels2 []Channel
	err := tx.Model(User{ID: request.MemberIds[0]}).Where(Channel{IsGroup: false}).Association("Channels").Find(&channels1)
	if err != nil{
		app.sendInternalServerError(c, err)
		return
	}
	err = tx.Model(User{ID: request.MemberIds[1]}).Where(Channel{IsGroup: false}).Association("Channels").Find(&channels2)
	if err != nil{
		app.sendInternalServerError(c, err)
		return
	}
	if commonChannel(&channels1, &channels2){
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "Channel already exists",
		})
		return
	}
	res := tx.Create(&newChannel)
	if res.Error != nil{
		app.sendInternalServerError(c, res.Error)
		return
	}
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "New channel created",
		Data: newChannel,
	})	
}

// Get all channels user is part of

func (app *App) getUserChannels(c *gin.Context){
	userId := c.GetUint("userId")
	var channels []Channel
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3);
	defer cancel()
	tx := app.Db.WithContext(ctx)
	err := tx.Model(&User{ID: userId}).Select("id", "isGroup").Association("Channels").Find(&channels)
	if err != nil{
		app.sendInternalServerError(c, err)
		return
	}
	var messages []Message
	err = tx.Model(channels).Association("Messages").Find(&messages)
	if err != nil{
		app.sendInternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, Response{
		Message: "",
		Success: true,
		Data: channels,
	})
}

type getChannelReponse struct{
	User User `json:"user"`
	Messages []Message `json:"messages"`
}

func (app *App) getChannel(c *gin.Context){
	channelId, _ := c.Params.Get("id")
	var users []User
	userId := c.GetUint("userId")
	channelIdInt, _ := strconv.Atoi(channelId)
	err := app.Db.Model(&Channel{ID: uint(channelIdInt)}).Select("username", "name", "id", "createdAt", "about", "profilePic", "gender").Association("Members").Find(&users)
	if err != nil {
		app.sendInternalServerError(c, err)
		return
	}
	messagesString, err := app.Cache.HGetAll(fmt.Sprintf("channel%d", channelIdInt)).Result()
	if err != nil{
		app.sendInternalServerError(c, err)
		return
	}
	// Find the latest message per channel
	var messages []Message
	for _, messageString := range messagesString{
		var message Message
		json.Unmarshal([]byte(messageString), &message)
		messages = append(messages, message)
	}
	numMessages := os.Getenv("CACHE_QUEUE_SIZE")
	numMessagesInt, _ := strconv.Atoi(numMessages)
	numMessagesInt = numMessagesInt/2
	sort.Slice(messages, func(i, j int) bool {
		return messages[i].CreatedAt.After(messages[j].CreatedAt)
	})
	var user User
	if users[0].ID == userId{
		user = users[1]
	}else{
		user = users[0]
	}
	if(len(messages)<numMessagesInt){
		numMessagesInt = len(messages)
	}
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: getChannelReponse{User: user, Messages: messages[0 : numMessagesInt]},
	})
}

func (app *App) deleteChannel(c *gin.Context){
	// Check if user belongs to channel
	id := c.Query("id")
	channelId, _ := strconv.Atoi(id)
	err := app.Db.Model(&User{ID: c.GetUint("userId")}).Association("Channels").Delete(Channel{ID: uint(channelId)})
	if err != nil {
		app.sendInternalServerError(c, err)
		return
	}
	res := app.Db.Delete(Channel{}, channelId)
	if res.Error != nil {
		app.sendInternalServerError(c, res.Error)
		return
	}
	c.JSON(http.StatusOK, Response{
		Success: true,
	})

}