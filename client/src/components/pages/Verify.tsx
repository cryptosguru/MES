import { useEffect } from "react"
import { useState } from "react"
import { useLocation } from "react-router"
import { get } from "../../utils/requests"
import Lottie from "react-lottie"
import emailVerifcation from "../../assets/emailVerification.json"
import { Link } from "react-router-dom"

const Verify = () => {
    const search = useLocation().search

    const query = new URLSearchParams(search)

    const [success, setSuccess] = useState<boolean>(false)
    const [message, setMessage] = useState<string>("")

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: emailVerifcation,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    }

    useEffect(() => {
        const verify = async () => {
            const data = await (
                await get(`/api/auth/verify?id=${query.get("id")}`, false)
            ).json()
            setSuccess(data.success)
            setMessage(data.message)
        }
        verify()
        //eslint-disable
    }, [])

    if (!success) {
        return (
            <div className="page">
                <div className="container">
                    <Lottie options={defaultOptions} width={400} height={400} />
                    <h2>{message}</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <Lottie options={defaultOptions} width={400} height={400} />
                <h2>{message}</h2>
                <Link to="/login">Login</Link>
            </div>
        </div>
    )
}

export default Verify
