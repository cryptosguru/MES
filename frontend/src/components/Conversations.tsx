import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useRootStore } from "../stores"
import { Channel } from "../stores/channels"
import { MessageComponent } from "./Messages"
import { messagePreview } from "../utils/utils"
//import { toJS } from "mobx"

const Search = observer(() => {
    const { searchString, searchContacts, search, toggleSearchMode } =
        useRootStore().channels

    return (
        <div className="search">
            <p>
                <b>Conversations</b>
            </p>
            <input
                type="text"
                placeholder={`${searchContacts ? "Search" : "Find new people"}`}
                defaultValue={searchString}
                onChange={search}
            />
            <div className="chats-toggle">
                <span>Recent chats</span>
                <b>
                    <button onClick={toggleSearchMode}>{`${
                        searchContacts ? "+ New Chats" : "Back"
                    }`}</button>
                </b>
            </div>
        </div>
    )
})

interface contactProps {
    channel: Channel
    index: number
}

const Contact = observer(({ channel, index }: contactProps) => {
    const {
        channelUsers,
        channels,
        currentChannelId,
        getChannelUser,
        setCurrentChannel,
        sortChannelsByLatestMessage,
    } = useRootStore().channels

    const { markAllAsRead } = useRootStore().messages

    const channelUser = channelUsers.find(
        (channelUser) => channelUser.channelId === channel.id
    )

    useEffect(() => {
        if (channelUser === undefined) getChannelUser(channel.id)
    }, [])

    useEffect(() => {
        if (channelUser && channels.length === channelUsers.length) {
            sortChannelsByLatestMessage()
        }
    }, [channelUser])

    if (channelUser?.profileURL.length === 0) {
        return <div>loading...</div>
    }
    return (
        <div
            className="contact"
            onClick={() => {
                setCurrentChannel(channel.id)
                markAllAsRead(channel.id)
            }}
            style={{
                backgroundColor:
                    currentChannelId === channel.id
                        ? "var(--light1)"
                        : "var(--dark2)",
            }}
        >
            <img alt="" src={channelUser?.profileURL} />
            <div className="right-content">
                <h3>{channelUser?.user.username}</h3>
                {channel.messages.length ? (
                    <MessageComponent
                        message={{
                            ...channel.messages[0],
                            text: messagePreview(channel.messages[0].text),
                        }}
                    />
                ) : null}
            </div>
        </div>
    )
})

const NewContact = observer(({ channel }: contactProps) => {
    const { currentChannelId, newChannelUsers, setCurrentChannel } =
        useRootStore().channels
    const channelUser = newChannelUsers.find(
        (newChannelUser) => newChannelUser.channelId === channel.id
    )

    return (
        <div
            className="contact"
            onClick={() => {
                setCurrentChannel(channel.id)
            }}
            style={{
                backgroundColor:
                    currentChannelId === channel.id
                        ? "var(--light1)"
                        : "var(--dark2)",
            }}
        >
            <img alt="" src={channelUser?.profileURL} />
            <div className="right-content">
                <h3>{channelUser?.user.username}</h3>
                {channel.messages.length ? (
                    <MessageComponent
                        message={{
                            ...channel.messages[0],
                            text: messagePreview(channel.messages[0].text),
                        }}
                    />
                ) : null}
            </div>
        </div>
    )
})

const Conversations = () => {
    const {
        isLoading,
        channels,
        searchContacts,
        searchString,
        channelUsers,
        newChannels,
        getAllChannels,
    } = useRootStore().channels

    useEffect(() => {
        getAllChannels()
    }, [])

    if (isLoading) {
        return <div>loading...</div>
    }

    return (
        <div className="conversations">
            <Search />
            <div className="contacts-container">
                {
                    // First filter according to search string
                }
                {searchContacts
                    ? channels
                          ?.filter((channel) => {
                              if (searchString.length === 0) {
                                  return true
                              }
                              const user = channelUsers.find(
                                  (ch) => ch.channelId === channel.id
                              )?.user
                              if (user === undefined) {
                                  return true
                              }
                              return (
                                  user.username.includes(searchString) ||
                                  user.name.includes(searchString)
                              )
                          })
                          .map((channel, index) => (
                              <Contact
                                  channel={channel}
                                  key={channel.id}
                                  index={index}
                              />
                          ))
                    : newChannels.map((channel, index) => (
                          <NewContact
                              channel={channel}
                              key={channel.id}
                              index={index}
                          />
                      ))}
            </div>
        </div>
    )
}

export default observer(Conversations)
