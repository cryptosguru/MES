import { action, makeObservable, observable } from "mobx"
import { register } from "../services/register"

export enum Gender {
    F = "F",
    M = "M",
    O = "O",
}

interface Field {
    error: string
    value: string
}

export interface IRegister {
    name: Field
    username: Field
    email: Field
    gender: Gender
    password: Field
    confirmPassword: Field
}

class Register {
    @observable
    defaultField: Field = { value: "", error: "" }

    @observable
    registerUser: IRegister = {
        name: this.defaultField,
        username: this.defaultField,
        email: this.defaultField,
        gender: Gender.F,
        password: this.defaultField,
        confirmPassword: this.defaultField,
    }

    @observable
    registerSuccess = false

    @observable
    message: string = ""

    constructor() {
        makeObservable(this)
    }

    @action
    updateFieldValue = (fieldName: string, newValue: string) => {
        switch (fieldName) {
            case "name":
                this.registerUser = {
                    ...this.registerUser,
                    name: {
                        ...this.registerUser.name,
                        value: newValue,
                    },
                }
                break
            case "username":
                this.registerUser = {
                    ...this.registerUser,
                    username: {
                        ...this.registerUser.name,
                        value: newValue,
                    },
                }
                break
            case "email":
                this.registerUser = {
                    ...this.registerUser,
                    email: {
                        ...this.registerUser.name,
                        value: newValue,
                    },
                }
                break
            case "password":
                this.registerUser = {
                    ...this.registerUser,
                    password: {
                        ...this.registerUser.password,
                        value: newValue,
                    },
                }
                break
            case "confirmPassword":
                this.registerUser = {
                    ...this.registerUser,
                    confirmPassword: {
                        ...this.registerUser.name,
                        value: newValue,
                    },
                }
                break
            default:
                console.log("INVALID")
        }
    }

    @action
    updateGender = (gender: string) => {
        this.registerUser = {
            ...this.registerUser,
            gender: Gender[gender as keyof typeof Gender],
        }
    }

    @action
    setMessage = (success: boolean, message: string) => {
        this.message = message
        this.registerSuccess = success
    }

    @action
    setRegisterUser = (user: IRegister) => {
        this.registerUser = { ...user }
    }
    @action
    submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { respBody, status, resp } = await register(this.registerUser)
        console.log(status, resp)
        if (status === 201) {
            this.setMessage(true, resp.message)
        } else {
            console.log(respBody)
            this.setRegisterUser(respBody)
            if (status === 400) {
                this.setMessage(false, resp.message)
            } else {
                this.setMessage(false, "")
            }
        }
    }
}

export default Register
