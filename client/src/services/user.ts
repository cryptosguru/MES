import { Gender } from "../stores/register"
import { IUser } from "../stores/user"
import { deleteRequest, get, post, postMultipartForm } from "../utils/requests"

export const login = async (email: string, password: string) => {
    const resp = await post("/api/auth/login", { email, password })
    const json = await resp.json()
    return { success: json.success, status: resp.status, message: json.message }
}

export const getProfilePic = async (
    profilePic: string | null,
    gender: Gender
) => {
    if (profilePic === null || profilePic.length === 0) {
        if (gender === Gender.F || gender === Gender.O) {
            return "/femaleAvatar.jpg"
        } else {
            return "/maleAvatar.jpg"
        }
    }
    const response = await get(`/api/user/profile?path=${profilePic}`)
    const blob = await response.blob()
    const urlCreator = window.URL || window.webkitURL
    return urlCreator.createObjectURL(blob)
}

export const getUser = async () => {
    try {
        const resp = await get("/api/user", true)
        const json = await resp.json()
        return {
            success: json.success,
            status: resp.status,
            user: json.data as IUser,
            message: json.message,
        }
    } catch (e) {
        throw e
    }
}

export const logout = async () => {
    try {
        const resp = await deleteRequest("/api/auth/logout", {})
        const json = await resp.json()
        return {
            success: json.success,
            status: resp.status,
            user: json.data as IUser,
            message: json.message,
        }
    } catch (e) {
        throw e
    }
}

export const uploadImage = async (image: File) => {
    try {
        const resp = await postMultipartForm(
            "/api/user/profile",
            "file",
            image,
            true
        )
        const json = await resp.json()
        return {
            success: json.success,
            status: resp.status,
            data: json.data,
        }
    } catch (e) {
        console.log(e)
    }
}
