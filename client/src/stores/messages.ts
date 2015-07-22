import { action, makeObservable, observable } from "mobx"
import { startWs } from "../services/messages"
import { Channels, Message } from "./channels"
import { User } from "./user"

enum AckTypes {
    READ = "READ",
    RECEIVED = "RECEIVED",
    SENT = "SENT",
}

enum StreamTypes {
    AKC = "ACK",
    MSG = "MSG",
}

interface Acknowledge {
    messageId: string
    frontendId: number
    createdAt: Date
    senderId: number
    channelId: number
    ackType: AckTypes
}

interface StreamData {
    type: StreamTypes
    message: Message | null
    acknowledge: Acknowledge | null
}

export class Messages {
    @observable channels: Channels
    @observable text = ""
    user: User
    // Temporary id that is used only as long as message is not marked as send from backend
    frontendId: number = 0

    ws: WebSocket | null = null

    connectionIsActive = false

    constructor(channels: Channels, user: User) {
        this.channels = channels
        this.user = user
        makeObservable(this)
    }

    @action
    receiveMessages = () => {
        this.ws = startWs()

        this.ws.onopen = () => {
            console.log("Connected")
            this.connectionIsActive = true
        }

        this.ws.onclose = (ev) => {
            console.log(ev.code)
            this.connectionIsActive = false
            if (ev.code === 1006 || ev.code === 1000) {
                return
            }
            this.reconnect()
        }

        this.ws.onmessage = (ev) => {
            const streamData: StreamData = JSON.parse(ev.data)
            if (streamData.acknowledge && streamData.type === StreamTypes.AKC) {
                this.updateMessage(streamData.acknowledge)
            } else if (streamData.message) {
                if (streamData.message.isNewChannel) {
                    this.channels.getChannelUser(streamData.message.channelId)
                } else {
                    this.pushMessage(streamData.message)
                }
                this.markAsReceived(streamData.message)
                if (
                    this.channels.currentChannelId ===
                    streamData.message.channelId
                ) {
                    // This channel is currently open
                    this.markAsRead(streamData.message)
                }
            }
        }

        this.ws.onerror = (ev: Event) => {
            console.log(ev)
        }
    }

    @action
    setText = (text: string) => {
        this.text = text
    }

    reconnect = () => {
        // Intervals in second (frequency at which reconnect attempts will be made in case of connection failure)
        const reconnectIntervals = [
            1, 1, 1, 3, 3, 3, 5, 5, 5, 15, 15, 15, 30, 30, 30,
        ]
        var curr = 0
        for (var i = 0; i < reconnectIntervals.length; i++) {
            curr = curr + reconnectIntervals[i]
            //
            setTimeout(() => {
                if (!this.connectionIsActive) this.receiveMessages()
            }, curr * 1000)
        }
    }

    @action
    sendMessage = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") {
            return
        }
        e.preventDefault()
        var newMessage: Message
        if (this.channels.searchContacts) {
            newMessage = {
                id: String(--this.frontendId),
                frontendId: this.frontendId,
                createdAt: new Date(),
                text: this.text,
                read: false,
                received: false,
                sent: false,
                channelId: this.channels.currentChannelId,
                senderId: this.user.id,
                isNewChannel: false,
            }
        } else {
            // searchContact = false implies this channel is not in contact list, hence it needs to be added first
            const channelId = await this.channels.createChannel()
            if (channelId === -1) {
                //Error
                return
            } else {
                newMessage = {
                    id: String(--this.frontendId),
                    frontendId: this.frontendId,
                    createdAt: new Date(),
                    text: this.text,
                    read: false,
                    received: false,
                    sent: false,
                    channelId,
                    senderId: this.user.id,
                    isNewChannel: true,
                }
            }
        }
        const streamData: StreamData = {
            type: StreamTypes.MSG,
            message: newMessage,
            acknowledge: null,
        }
        this.pushMessage(newMessage)
        this.setText("")
        this.ws?.send(JSON.stringify(streamData))
    }

    @action
    pushMessage = (message: Message) => {
        this.channels.pushMessage(message)
    }

    @action
    updateMessage = (acknowledge: Acknowledge) => {
        const channelIdx = this.channels.channels.findIndex(
            (channel) => channel.id === acknowledge.channelId
        )
        if (channelIdx === -1) {
            return
        }
        if (acknowledge.ackType === AckTypes.SENT) {
            // Find message by frontend ID
            const messageIdx = this.channels.channels[
                channelIdx
            ].messages.findIndex(
                (message) => message.frontendId === acknowledge.frontendId
            )
            if (messageIdx === -1) {
                return
            }
            this.channels.channels[channelIdx].messages[messageIdx] = {
                ...this.channels.channels[channelIdx].messages[messageIdx],
                sent: true,
                createdAt: acknowledge.createdAt,
                senderId: acknowledge.senderId,
                id: acknowledge.messageId,
            }

            return
        }
        // Find message by actual id
        const messageIdx = this.channels.channels[
            channelIdx
        ].messages.findIndex((message) => message.id === acknowledge.messageId)
        if (messageIdx === -1) {
            return
        }
        if (acknowledge.ackType === AckTypes.RECEIVED)
            this.channels.channels[channelIdx].messages[messageIdx].received =
                true
        else if (acknowledge.ackType === AckTypes.READ) {
            this.channels.channels[channelIdx].messages[messageIdx].read = true
        }
    }

    @action
    markAsReceived = (message: Message) => {
        const acknowledge: StreamData = {
            type: StreamTypes.AKC,
            acknowledge: {
                messageId: message.id,
                frontendId: 0,
                senderId: message.senderId,
                channelId: message.channelId,
                createdAt: message.createdAt,
                ackType: AckTypes.RECEIVED,
            },
            message: null,
        }
        this.ws?.send(JSON.stringify(acknowledge))
    }

    @action
    markAsRead = (message: Message) => {
        const channelIdx = this.channels.channels.findIndex(
            (channel) => channel.id === message.channelId
        )
        if (channelIdx === -1) {
            return
        }
        const messageIdx = this.channels.channels[
            channelIdx
        ].messages.findIndex((msg) => msg.id === message.id)
        if (messageIdx === -1) {
            return
        }
        const acknowledge: StreamData = {
            type: StreamTypes.AKC,
            acknowledge: {
                messageId: message.id,
                frontendId: 0,
                senderId: message.senderId,
                channelId: message.channelId,
                createdAt: message.createdAt,
                ackType: AckTypes.READ,
            },
            message: null,
        }
        this.ws?.send(JSON.stringify(acknowledge))
        // State needs to be updated, to prevent the same message being ACKed as read multiple times
        this.channels.channels[channelIdx].messages[messageIdx].read = true
    }

    @action
    markAllAsRead = (channelId: number) => {
        // Function to mark all unread messages as read
        this.channels.channels
            .find((channel) => channel.id === channelId)
            ?.messages.forEach((message) => {
                if (message.senderId !== this.user.id && !message.read) {
                    this.markAsRead(message)
                }
            })
    }
}
