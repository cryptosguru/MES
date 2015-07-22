export const messagePreview = (text: string): string => {
    if (text.length <= 20) {
        return text
    }
    return text.substring(0, 17) + "..."
}
