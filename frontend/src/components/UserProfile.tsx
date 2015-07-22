import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useRootStore } from "../stores"

const ProfilePic = observer(() => {
    const { profileURL, tempProfilePic, getProfilePic, uploadProfilePic } =
        useRootStore().user

    useEffect(() => {
        getProfilePic()
    }, [getProfilePic])

    return (
        <div>
            <input
                type="file"
                id="profileUpload"
                onChange={(e) => {
                    uploadProfilePic(e)
                }}
            />
            <label
                htmlFor="profileUpload"
                onMouseEnter={() => {
                    const banner = document.querySelector(".profile .banner")
                    if (banner) {
                        banner.setAttribute("style", "visibility: visible;")
                    }
                }}
                onMouseLeave={() => {
                    const banner = document.querySelector(".profile .banner")
                    if (banner) {
                        banner.setAttribute("style", "visibility: hidden;")
                    }
                }}
            >
                <img
                    alt=""
                    src={tempProfilePic.length ? tempProfilePic : profileURL}
                    className="profilePic"
                />
                <div className="banner">Update</div>
            </label>
        </div>
    )
})

const UserProfile = () => {
    const {
        userLoading,
        name,
        username,
        tempProfilePic,
        logout,
        setUser,
        uploadImage,
        cancelImage,
    } = useRootStore().user

    useEffect(() => {
        setUser()
    }, [setUser])

    if (userLoading) {
        return <div />
    }
    return (
        <div className="userProfile">
            <div className="profile">
                <ProfilePic />
                {tempProfilePic.length ? (
                    <p>
                        <span>
                            <button onClick={cancelImage}>Cancel</button>
                        </span>
                        <span>
                            <button onClick={uploadImage}>Save</button>
                        </span>
                    </p>
                ) : null}
                <p>
                    <b>{name}</b>
                </p>
                <p>{username}</p>
            </div>
            <div className="options">
                <button onClick={() => logout()}>Logout</button>
            </div>
        </div>
    )
}

export default observer(UserProfile)
