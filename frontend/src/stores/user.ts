import { action, makeObservable, observable, runInAction } from "mobx"
import {
    getProfilePic,
    getUser,
    login,
    logout,
    uploadImage,
} from "../services/user"
import { Gender } from "./register"

export interface IUser {
    id: number
    name: string
    username: string
    email: string
    createdAt: Date
    gender: Gender
    profilePic: string | null
    isAuth: boolean | null
}

export class User implements IUser {
    constructor() {
        makeObservable(this)
    }
    @observable id = 0
    @observable name = ""
    @observable username = ""
    @observable email = ""
    @observable createdAt = new Date()
    @observable gender = Gender.F
    @observable profilePic: string | null = null
    @observable isAuth: boolean | null = null
    @observable profileURL = ""
    @observable password = ""
    @observable err = ""
    @observable success = false
    @observable userLoading = true
    @observable tempProfilePic = ""

    tempProfilePicFile: File | null = null

    @action
    setPassword = (password: string) => {
        this.password = password
    }

    @action
    setEmail = (email: string) => {
        this.email = email
    }

    @action
    login = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        login(this.email, this.password)
            .then(({ status, success, message }) => {
                if (!success) {
                    runInAction(() => {
                        this.err = message
                    })
                } else {
                    runInAction(() => {
                        this.err = ""
                        this.success = true
                        this.isAuth = true
                    })
                }
            })
            .catch((err) => console.log(err))
    }

    @action
    getProfilePic = () => {
        getProfilePic(this.profilePic, this.gender)
            .then((url) =>
                runInAction(() => {
                    this.profileURL = url
                })
            )
            .catch((err) => console.log(err))
    }

    @action
    setUser = () => {
        this.isAuth = null
        getUser()
            .then(({ status, success, message, user }) => {
                if (status >= 400 || !success) {
                    console.log(message)
                    runInAction(() => {
                        this.isAuth = false
                    })
                    return
                }
                runInAction(() => {
                    this.id = user.id
                    this.name = user.name
                    this.username = user.username
                    this.email = user.email
                    this.createdAt = user.createdAt
                    this.gender = user.gender
                    this.profilePic = user.profilePic
                    this.isAuth = true
                    this.userLoading = false
                })
            })
            .catch((err) => console.log(err))
    }

    @action
    logout = () => {
        logout()
            .then(({ status, success, message }) => {
                if (success) {
                    runInAction(() => {
                        this.isAuth = false
                    })
                } else {
                    console.log(status, message)
                }
            })
            .catch((err) => console.log(err))
    }

    @action
    uploadProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
        // File validation needed
        const image = e.target.files?.[0] || e.target.files?.[0]
        if (image === undefined) {
            return
        }
        const urlCreator = window.URL || window.webkitURL
        this.tempProfilePic = urlCreator.createObjectURL(image)
        this.tempProfilePicFile = image
    }

    @action
    uploadImage = async () => {
        if (this.tempProfilePicFile === null) {
            // Handle error maybe
            return
        }
        const resp = await uploadImage(this.tempProfilePicFile)
        console.log(resp)
        if (resp?.success) {
            runInAction(() => {
                this.profileURL = this.tempProfilePic
                this.tempProfilePic = ""
                this.tempProfilePicFile = null
            })
        } else {
            this.cancelImage()
        }
    }

    @action
    cancelImage = () => {
        this.tempProfilePic = ""
        this.tempProfilePicFile = null
    }
}
