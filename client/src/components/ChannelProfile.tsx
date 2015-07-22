import { observer } from "mobx-react-lite"
import { useRootStore } from "../stores"

const ChannelProfile = () => {
    const {
        currentChannelId,
        searchContacts,
        channelUsers,
        newChannelUsers,
        channelProfileOpen,
        toggleChannelProfile,
        deleteChannel,
    } = useRootStore().channels
    const channelUser = searchContacts
        ? channelUsers.find((user) => user.channelId === currentChannelId)
        : newChannelUsers.find((user) => user.channelId === currentChannelId)

    return (
        <div
            className={`channel-profile ${
                channelProfileOpen
                    ? "expand-channel-profile"
                    : "shrink-channel-profile"
            }`}
        >
            <div className="header">
                <button
                    onClick={() => {
                        toggleChannelProfile()
                    }}
                >
                    <i className="fas fa-times"></i>
                </button>
                <h3>Contact Info </h3>
            </div>
            <img alt="" src={channelUser?.profileURL} />
            <h3>{channelUser?.user.name}</h3>
            <button onClick={deleteChannel}>
                <i className="fas fa-trash-alt"></i>
                Delete Chat
            </button>
        </div>
    )
}

export default observer(ChannelProfile)
