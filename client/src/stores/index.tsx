import React, { createContext, ReactNode } from "react"
import { useContext } from "react"
import { Channels } from "./channels"
import { Messages } from "./messages"
import Register from "./register"
import { User } from "./user"

export class RootStore {
    register: Register
    user: User
    messages: Messages
    channels: Channels

    constructor() {
        this.register = new Register()
        this.user = new User()
        this.channels = new Channels(this.user)
        this.messages = new Messages(this.channels, this.user)
    }
}

const RootContext = createContext({} as RootStore)

export const useRootStore = () => useContext(RootContext)

interface StoreComponent {
    store: RootStore
    children: ReactNode
}

const RootProvider: React.FC<StoreComponent> = ({ children, store }) => {
    return <RootContext.Provider value={store}>{children}</RootContext.Provider>
}

export default RootProvider
