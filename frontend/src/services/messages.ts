export const startWs = () => {
    return new WebSocket("ws://localhost:3000/api/chat")
}
