import { observer } from "mobx-react-lite"
import { useState } from "react"
import { Link, Redirect } from "react-router-dom"
import { useRootStore } from "../../stores"
import { Gender } from "../../stores/register"

const Register = observer(() => {
    const {
        registerUser: {
            name,
            email,
            username,
            gender,
            password,
            confirmPassword,
        },
        message,
        submit,
        updateFieldValue,
        updateGender,
    } = useRootStore().register
    const { isAuth } = useRootStore().user
    const [toggleP, setToggleP] = useState<boolean>(false)
    const [toggleCP, setToggleCP] = useState<boolean>(false)
    const callback = (cb: any) => cb()

    if (isAuth) {
        return <Redirect to="/" />
    }

    return (
        <div className="page">
            <div className="auth-container">
                <h2>Sign Up</h2>
                <form onSubmit={(e) => submit(e)}>
                    <div>
                        <label>Name</label>
                        <input
                            type={"text"}
                            onChange={(e) =>
                                updateFieldValue("name", e.target.value)
                            }
                        ></input>
                        <p>{name.error}</p>
                    </div>
                    <div>
                        <label>Username</label>
                        <input
                            type={"text"}
                            defaultValue={username.value}
                            onChange={(e) =>
                                updateFieldValue("username", e.target.value)
                            }
                        ></input>
                        <p>{username.error}</p>
                    </div>
                    <div>
                        <label>Email</label>
                        <input
                            type={"text"}
                            defaultValue={email.value}
                            onChange={(e) =>
                                updateFieldValue("email", e.target.value)
                            }
                        ></input>
                        <p>{email.error}</p>
                    </div>
                    <div>
                        Gender
                        {callback(() => {
                            var rows: React.ReactElement[] = []
                            for (let member in Gender) {
                                rows.push(
                                    <div
                                        className="radio-checkbox"
                                        key={member}
                                    >
                                        {gender === member ? (
                                            <input
                                                name={"radio"}
                                                defaultChecked
                                                id={member}
                                                type={"radio"}
                                                onChange={
                                                    // eslint-disable-next-line no-loop-func
                                                    () => updateGender(member)
                                                }
                                            ></input>
                                        ) : (
                                            <input
                                                name={"radio"}
                                                id={member}
                                                type={"radio"}
                                                onChange={
                                                    // eslint-disable-next-line no-loop-func
                                                    () => updateGender(member)
                                                }
                                            ></input>
                                        )}
                                        <span className="styled-radio"></span>
                                        <label htmlFor={member}>{member}</label>
                                    </div>
                                )
                            }
                            return rows
                        })}
                    </div>
                    <div>
                        <label>Password</label>
                        <input
                            type={toggleP ? "text" : "password"}
                            defaultValue={password.value}
                            onChange={(e) =>
                                updateFieldValue("password", e.target.value)
                            }
                        />
                        {toggleP ? (
                            <i
                                className="fas fa-eye-slash"
                                onClick={() => setToggleP(!toggleP)}
                            ></i>
                        ) : (
                            <i
                                className="fas fa-eye"
                                onClick={() => setToggleP(!toggleP)}
                            ></i>
                        )}
                        <p>{password.error}</p>
                    </div>
                    <div>
                        <label>Confirm Password</label>
                        <input
                            type={toggleCP ? "text" : "password"}
                            defaultValue={confirmPassword.value}
                            onChange={(e) =>
                                updateFieldValue(
                                    "confirmPassword",
                                    e.target.value
                                )
                            }
                        />
                        {toggleCP ? (
                            <i
                                className="fas fa-eye-slash"
                                onClick={() => setToggleCP(!toggleCP)}
                            ></i>
                        ) : (
                            <i
                                className="fas fa-eye"
                                onClick={() => setToggleCP(!toggleCP)}
                            ></i>
                        )}
                        <p>{confirmPassword.error}</p>
                    </div>
                    <b>{message}</b>
                    <input type="submit" value="Submit"></input>
                    <Link to="/login">Already have an account?</Link>
                </form>
            </div>
        </div>
    )
})

export default Register
