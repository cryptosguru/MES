import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { Link, Redirect } from "react-router-dom"
import { useRootStore } from "../../stores"

const Login = () => {
    const {
        email,
        password,
        err,
        isAuth,
        success,
        setEmail,
        setPassword,
        login,
        setUser,
    } = useRootStore().user

    useEffect(() => {
        if (isAuth === null) setUser()
    }, [setUser, isAuth])

    if (success === true || isAuth === true) {
        return <Redirect to="/" />
    }

    return (
        <div className="page">
            <div className="auth-container">
                <h2>Login</h2>
                <form onSubmit={(e) => login(e)}>
                    <div>
                        <label>Email</label>
                        <input
                            type="text"
                            defaultValue={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                            }}
                        />
                    </div>
                    <div>
                        <label>Password</label>
                        <input
                            type="password"
                            defaultValue={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                            }}
                        />
                    </div>
                    <div>
                        <b>{err}</b>
                    </div>
                    <input type="submit" value="Submit" />
                    <Link to="/signup">Do not have an account?</Link>
                </form>
            </div>
        </div>
    )
}

export default observer(Login)
