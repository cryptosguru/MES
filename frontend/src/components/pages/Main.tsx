import ChannelProfile from "../ChannelProfile"
import Conversations from "../Conversations"
import Messages from "../Messages"
import UserProfile from "../UserProfile"

const Main = () => {
    return (
        <div className="page">
            <main>
                <UserProfile />
                <Conversations />
                <Messages />
                <ChannelProfile />
            </main>
        </div>
    )
}

export default Main
