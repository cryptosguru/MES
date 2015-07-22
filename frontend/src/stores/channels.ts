import { action, makeObservable, observable, runInAction, toJS } from "mobx"
import {
    createChannel,
    deleteChannel,
    getChannel,
    getChannels,
    search,
} from "../services/channels"
import { getProfilePic } from "../services/user"
import { IUser, User } from "./user"

export interface Message {
    id: string
    frontendId: number
    text: string
    read: boolean
    received: boolean
    sent: boolean
    channelId: number
    senderId: number
    createdAt: Date
    isNewChannel: boolean
}

export interface Channel {
    id: number
    isGroup: boolean
    messages: Message[]
}

interface ChannelUser {
    channelId: number
    user: IUser
    profileURL: string
}

export class Channels {
    @observable channels: Channel[] = []
    @observable currentChannelId: number = 0
    @observable currentChannelIndex: number = -1
    @observable channelUsers: ChannelUser[] = []
    @observable isLoading = true
    @observable channelProfileOpen = false
    @observable searchContacts = true // When false, search for new people
    @observable searchString = ""
    @observable newChannels: Channel[] = []
    @observable newChannelUsers: ChannelUser[] = []
    user: User

    constructor(user: User) {
        this.user = user
        makeObservable(this)
    }

    @action
    getAllChannels = () => {
        getChannels()
            .then((channels) => {
                if (channels) {
                    runInAction(() => {
                        this.channels = [...channels]
                        this.isLoading = false
                    })
                }
            })
            .catch((err) => console.log(err))
    }

    @action
    getChannelUser = async (channelId: number) => {
        try {
            const res = await getChannel(channelId)
            if (res.success) {
                const profileURL = await getProfilePic(
                    res.data.user.profilePic,
                    res.data.user.gender
                )
                const idx = this.channels.findIndex(
                    (channel) => channel.id === channelId
                )
                if (idx === -1) {
                    runInAction(() => {
                        // IS GROUP NEEDS TO BE CHANGED LATER
                        this.channels = [
                            {
                                id: channelId,
                                isGroup: false,
                                messages: res.data.messages,
                            },
                            ...this.channels,
                        ]
                    })
                    return
                }
                runInAction(() => {
                    this.channels = this.channels.map((channel) => {
                        if (channel.id === channelId) {
                            return {
                                ...channel,
                                messages: [...res.data.messages],
                            }
                        }

                        return channel
                    })
                    this.channelUsers = [
                        ...this.channelUsers,
                        {
                            user: res.data.user,
                            channelId,
                            profileURL,
                        },
                    ]
                })
                //console.log(toJS(this.channels), toJS(this.channelUsers))
                return true
            }
        } catch (err) {
            console.log(err)
        }
        return false
    }

    @action
    sortChannelsByLatestMessage = () => {
        // This function sorts channls according to the latest message sent. First this.channels
        // is sorted since it holds messages data. Then this.channelUsers is set to the same order
        // as this.channels. Error("Something went wrong") is just to prevent sortedChannelUsers from
        // containing undefined data
        console.log(toJS(this.channels), toJS(this.channelUsers))
        this.channels.sort((channel1, channel2) =>
            channel1.messages[0].createdAt < channel2.messages[0].createdAt
                ? 1
                : -1
        )
        const sortedChannelUsers = this.channels.map((channel) => {
            var channelUser: ChannelUser | undefined
            if (this.searchContacts) {
                channelUser = this.channelUsers.find(
                    (channelUser) => channelUser.channelId === channel.id
                )
            } else {
                channelUser = this.newChannelUsers.find(
                    (newChannelUser) => newChannelUser.channelId === channel.id
                )
            }
            if (channelUser) {
                return channelUser
            }
            throw Error("Something went wrong")
        })
        this.channelUsers = sortedChannelUsers
    }

    @action
    setCurrentChannel = (id: number) => {
        this.currentChannelId = id
        if (id === 0) {
            this.currentChannelIndex = -1
        } else {
            this.setCurrentChannelIndex()
        }
    }

    @action
    setCurrentChannelIndex = () => {
        if (this.searchContacts)
            this.currentChannelIndex = this.channels.findIndex(
                (channel) => channel.id === this.currentChannelId
            )
        else
            this.currentChannelIndex = this.newChannels.findIndex(
                (newChannel) => newChannel.id === this.currentChannelId
            )
    }

    @action
    pushMessage = (message: Message) => {
        const idx = this.channels.findIndex(
            (channel) => channel.id === message.channelId
        )
        if (idx === -1) {
            this.getAllChannels()
            return
        }

        this.channels[idx] = {
            ...this.channels[idx],
            messages: [message, ...this.channels[idx].messages],
        }
        this.sortChannels(message.channelId)
    }

    @action
    sortChannels = (channelId: number) => {
        // Shift channel to top
        // This makes sure that whichever channels gets the latest message stays at top
        const idx = this.channels.findIndex(
            (channel) => channel.id === channelId
        )
        if (idx === -1 || idx === 0) return
        const newChannels = [
            this.channels[idx],
            ...this.channels.slice(0, idx),
            ...this.channels.slice(idx + 1, this.channels.length),
        ]
        this.channels = newChannels
        this.setCurrentChannelIndex()
    }

    @action
    toggleChannelProfile = () => {
        this.channelProfileOpen = !this.channelProfileOpen
    }

    @action
    toggleSearchMode = () => {
        this.setCurrentChannel(-1)
        this.searchContacts = !this.searchContacts
    }

    @action search = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.searchString = e.target.value
        if (this.searchString.length === 0) {
            return
        }
        this.newChannelUsers = []
        this.newChannels = []
        if (!this.searchContacts) {
            search(this.searchString).then((json) => {
                json.data.forEach((user: IUser) => {
                    // If user is already a friend, don't add to new channel user list
                    if (
                        this.channelUsers.findIndex(
                            (chUser) => chUser.user.id === user.id
                        ) !== -1
                    ) {
                        return
                    }
                    getProfilePic(user.profilePic, user.gender).then(
                        (profileURL: string) => {
                            runInAction(() => {
                                this.newChannelUsers = [
                                    ...this.newChannelUsers,
                                    {
                                        channelId: user.id,
                                        user,
                                        profileURL,
                                    },
                                ]
                                this.newChannels = [
                                    ...this.newChannels,
                                    {
                                        id: user.id,
                                        isGroup: false,
                                        messages: [],
                                    },
                                ]
                            })
                        }
                    )
                })
            })
        }
    }

    @action
    createChannel = async () => {
        const res = await createChannel([this.currentChannelId, this.user.id])
        if (res.success) {
            runInAction(() => {
                this.channels = [
                    { id: res.data.id, isGroup: false, messages: [] },
                    ...this.channels,
                ]
                this.searchString = ""
                // channelUser's channelID needs to be updated with newly obtained actual id, otherwise sortChannelsByLatestMessage will give error
                const ix = this.newChannelUsers.findIndex(
                    (channelUser) =>
                        channelUser.channelId === this.currentChannelId
                )
                if (ix !== -1) {
                    this.newChannelUsers[ix].channelId = res.data.id
                }
            })
            this.toggleSearchMode()
            this.setCurrentChannel(res.data.id)
            return res.data.id
        } else {
            return -1
        }
    }

    @action
    deleteChannel = async () => {
        const res = await deleteChannel(this.currentChannelId)
        if (res.success) {
            runInAction(() => {
                this.toggleChannelProfile()
                this.channels = this.channels.filter(
                    (channel) => channel.id !== this.currentChannelId
                )
                this.channelUsers = this.channelUsers.filter(
                    (channelUser) =>
                        channelUser.channelId !== this.currentChannelId
                )
                this.setCurrentChannel(0)
            })
        } else {
            console.log(res)
        }
    }
}
