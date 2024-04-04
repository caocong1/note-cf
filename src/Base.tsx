import React, { useEffect } from "react"


console.log(import.meta.env.VITE_API)
const Base: React.FC = () => {
    console.log('Base')
    useEffect(() => {
        fetch(import.meta.env.VITE_API + '/get-peers', {
            method: 'POST',
            body: { a: 1 }
        }).then(res => res.json()).then((res) => {
            console.log(res)
        })
    }, [])

    return null
}

export default Base