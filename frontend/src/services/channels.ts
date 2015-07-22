import { Channel } from "../stores/channels"
import { deleteRequest, get, post } from "../utils/requests"

export const getChannels = async () => {
    const resp = await get(`/api/channels`)
    const json = await resp.json()
    if (json.success) {
        const channels: Channel[] = json.data.map((channel: Channel) => {
            channel.messages = []
            return channel
        })
        return channels
    } else {
        console.log(json.message)
    }
}

export const getChannel = async (channelId: number) => {
    const resp = await get(`/api/channel/${channelId}/`)
    const json = await resp.json()

    return json
}

export const search = async (searchString: string) => {
    const resp = await post("/api/users/search", {
        key: searchString,
    })
    const json = await resp.json()
    return json
}

export const createChannel = async (
    memberIds: number[],
    isGroup: boolean = false
) => {
    const resp = await post("/api/channel", {
        isGroup,
        memberIds,
    })
    const json = await resp.json()
    return json
}

export const deleteChannel = async (channelId: number) => {
    const resp = await deleteRequest(`/api/channel?id=${channelId}`, {})
    const json = await resp.json()
    return json
}
