export const get = async (address: string, credentials: boolean = true) => {
    try {
        const response = await fetch(address, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: credentials ? "include" : "omit",
        })
        return response
    } catch (err) {
        throw err
    }
}

export const post = async (
    address: string,
    body: any,
    credentials: boolean = true
) => {
    try {
        const response = await fetch(address, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: credentials ? "include" : "omit",
            body: JSON.stringify(body),
        })
        return response
    } catch (err) {
        throw err
    }
}

export const postMultipartForm = async (
    address: string,
    name: string,
    file: File,
    credentials: boolean = true
) => {
    const formData = new FormData()
    formData.append(name, file)
    try {
        const response = await fetch(address, {
            method: "POST",
            credentials: credentials ? "include" : "omit",
            body: formData,
        })
        return response
    } catch (err) {
        throw err
    }
}

export const deleteRequest = async (
    address: string,
    body: any,
    credentials: boolean = true
) => {
    try {
        const response = await fetch(address, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: credentials ? "include" : "omit",
            body: JSON.stringify(body),
        })
        return response
    } catch (err) {
        throw err
    }
}

export const put = async (
    address: string,
    body: any,
    credentials: boolean = true
) => {
    try {
        const response = await fetch(address, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: credentials ? "include" : "omit",
            body: JSON.stringify(body),
        })
        return response
    } catch (err) {
        throw err
    }
}
