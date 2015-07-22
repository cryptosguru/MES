import { IRegister } from "../stores/register"
import { post } from "../utils/requests"

export const register = async (body: IRegister) => {
    const EMPTY_FIELD = "Field cannot be empty"
    try {
        const plainResp = await post(
            "/api/auth/register",
            {
                name: body.name.value,
                username: body.username.value,
                email: body.email.value,
                password: body.password.value,
                confirmPassword: body.confirmPassword.value,
                gender: body.gender,
            },
            false
        )
        const status = plainResp.status
        const resp = await plainResp.json()
        var respBody: IRegister = body
        respBody.username.error = ""
        respBody.name.error = ""
        respBody.email.error = ""
        respBody.password.error = ""
        respBody.confirmPassword.error = ""
        if (status === 201) {
            return { resp, respBody, status }
        }
        resp.data?.map((err: any) => {
            switch (err.field) {
                case "name": {
                    if (err.tag === "required") {
                        respBody.name.error = EMPTY_FIELD
                    } else if (err.tag === "min" || err.tag === "max") {
                        respBody.name.error =
                            "Name must contain between 3 and 20 characters"
                    }
                    break
                }
                case "email": {
                    if (err.tag === "required") {
                        respBody.email.error = EMPTY_FIELD
                    } else if (err.tag === "email") {
                        respBody.email.error = "Invalid email ID"
                    }
                    break
                }
                case "username": {
                    if (err.tag === "required") {
                        respBody.username.error = EMPTY_FIELD
                    } else if (err.tag === "min" || err.tag === "max") {
                        respBody.username.error =
                            "Username must contain 3 to 20 characters only"
                    } else {
                        respBody.username.error = "Invalid username"
                    }
                    break
                }
                case "password": {
                    if (err.tag === "required") {
                        respBody.password.error = EMPTY_FIELD
                    } else if (err.tag === "min" || err.tag === "max") {
                        respBody.password.error =
                            "Password must contain between 6 and 20 characters"
                    }
                    break
                }
                case "confirmPassword": {
                    if (err.tag === "required") {
                        respBody.confirmPassword.error = EMPTY_FIELD
                    } else {
                        respBody.confirmPassword.error =
                            "Does not match with password"
                    }
                    break
                }
            }
            return null
        })
        return { resp, respBody, status }
    } catch (e) {
        throw e
    }
}
