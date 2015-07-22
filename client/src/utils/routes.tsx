import { observer } from "mobx-react-lite"
import { Redirect, Route } from "react-router"
import { useRootStore } from "../stores"
// import { useRootStore } from "../stores"

const Protected = ({ ...rest }) => {
    const { isAuth } = useRootStore().user

    if (isAuth === false) {
        return <Redirect to="/login" />
    }

    return <Route {...rest} />
}

export default observer(Protected)
