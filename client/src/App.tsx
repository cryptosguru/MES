import React from "react"
import { Route, Switch } from "react-router-dom"
import Login from "./components/pages/Login"
import Main from "./components/pages/Main"
import Register from "./components/pages/Register"
import Verify from "./components/pages/Verify"
import Protected from "./utils/routes"

function App() {
    return (
        <div className="App">
            <Switch>
                <Route path="/signup">
                    <Register />
                </Route>
                <Route path="/verify">
                    <Verify />
                </Route>
                <Route path="/login">
                    <Login />
                </Route>
                <Protected exact path="/" render={() => <Main />} />
            </Switch>
        </div>
    )
}

export default App
