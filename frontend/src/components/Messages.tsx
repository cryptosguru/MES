import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useRootStore } from "../stores"
import { Message } from "../stores/channels"

interface MessageProp {
    message: Message
}

interface StatusProps {
    message: Message
    userId: number
}

const MessageStatus = observer(({ message, userId }: StatusProps) => {
    if (message.senderId !== userId) {
        return <div />
    }

    return message.read ? (
        <div className="check-marks">
            <i className="fa fa-check green-check" aria-hidden="true"></i>
            <i className="fa fa-check green-check" aria-hidden="true"></i>
        </div>
    ) : message.received ? (
        <div className="check-marks">
            <i className="fa fa-check" aria-hidden="true"></i>
            <i className="fa fa-check" aria-hidden="true"></i>
        </div>
    ) : message.sent ? (
        <div className="check-marks">
            <i className="fa fa-check" aria-hidden="true"></i>
        </div>
    ) : (
        <div />
    )
})

export const MessageComponent = observer(({ message }: MessageProp) => {
    const { id } = useRootStore().user
    return (
        <div
            className={`message  ${
                message.senderId === id ? "shift-right" : ""
            }`}
        >
            <p className={`text`}>{message.text}</p>
            <div className="time-and-status">
                <MessageStatus message={message} userId={id} />
                <div className="time">
                    {new Date(message.createdAt).toLocaleTimeString()}
                </div>
            </div>
        </div>
    )
})

const Messages = () => {
    const { text, receiveMessages, setText, sendMessage } =
        useRootStore().messages
    const {
        currentChannelId,
        channels,
        currentChannelIndex,
        channelUsers,
        channelProfileOpen,
        searchContacts,
        newChannels,
        newChannelUsers,
        toggleChannelProfile,
    } = useRootStore().channels

    useEffect(() => {
        receiveMessages()
    }, [receiveMessages])

    if (currentChannelId === 0 || currentChannelIndex === -1) {
        return (
            <div className="messages-container">
                <p className="noChannel">Start a conversation</p>
            </div>
        )
    }

    return (
        <div
            className={`messages-container ${
                channelProfileOpen
                    ? "shrink-messages-container"
                    : "expand-messages-container"
            }`}
        >
            <div className="header">
                <div>
                    <p>
                        {searchContacts
                            ? channelUsers.find(
                                  (user) => user.channelId === currentChannelId
                              )?.user.name
                            : newChannelUsers.find(
                                  (user) => user.channelId === currentChannelId
                              )?.user.name}
                    </p>
                </div>
                <div>
                    <button
                        onMouseEnter={() => {
                            document
                                .querySelector(
                                    ".messages-container > .header button > .banner"
                                )
                                ?.setAttribute("style", "visibility: visible;")
                        }}
                        onMouseLeave={() => {
                            document
                                .querySelector(
                                    ".messages-container > .header button > .banner"
                                )
                                ?.setAttribute("style", "visibility: hidden;")
                        }}
                        onClick={() => {
                            toggleChannelProfile()
                        }}
                    >
                        <i className="fas fa-ellipsis-v"></i>
                        <div className="banner">View profile</div>
                    </button>
                </div>
            </div>
            <div className="messages">
                {searchContacts
                    ? channels[currentChannelIndex].messages.map((message) => (
                          <div className="message-container" key={message.id}>
                              <MessageComponent message={message} />
                          </div>
                      ))
                    : newChannels[currentChannelIndex].messages.map(
                          (message) => (
                              <div
                                  className="message-container"
                                  key={message.id}
                              >
                                  <MessageComponent message={message} />
                              </div>
                          )
                      )}
            </div>
            <div className="textarea-container">
                <textarea
                    value={text}
                    className="sendMessages"
                    placeholder={"Send a message"}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => sendMessage(e)}
                ></textarea>
            </div>
        </div>
    )
}

export default observer(Messages)
