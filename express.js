import express from "express"
import { ExpressPeerServer } from "peer"

let input = {}
let peers = {}

const app = express();

app.post("/get-peers", (req, res, next) => {
    console.log(req)
    res.send([])
})

// =======

const server = app.listen(9000);

const peerServer = ExpressPeerServer(server, {
	path: "/",
});

app.use("/peerjs", peerServer);

console.log('server start')
