import express from 'express'
import { ExpressPeerServer } from 'peer'
import cors from 'cors'
import * as https from 'node:https'
import * as fs from 'node:fs'

let peers = {}
let content = {}
let board = {}

const app = express()

app.use(express.json({ limit: '100mb' }))
app.use(cors())

app.use(express.static('dist'))

const prefixPath = process.env.VITE_PATH || '/'

app.post(prefixPath + 'get-peers', (req, res) => {
  // console.log(req.body);
  res.json(peers[req.body.pathname] || [])
})

app.post(prefixPath + 'add-peer', (req, res) => {
  const { pathname, peerId, name } = req.body
  // console.log("add-peer", pathname, peerId, peers);
  peers[pathname] = peers[pathname] || []
  const isExist = peers[pathname].some((p) => p.peerId === peerId)
  if (!isExist) {
    peers[pathname].push({
      peerId,
      name,
    })
  }
  // console.log("peers", peers);
  content[pathname] = content[pathname] || ''
  res.json({
    peers: peers[pathname],
    content: content[pathname],
    board: board[pathname],
  })
})

app.post(prefixPath + 'get-peer', (req, res) => {
  const { pathname, peerId } = req.body
  // console.log("get-peer", pathname, peerId);
  peers[pathname] = peers[pathname] || []
  const peer = peers[pathname].find((p) => p.peerId === peerId)
  res.send(peer)
})

app.post(prefixPath + 'change-name', (req, res) => {
  const { pathname, peerId, name } = req.body
  peers[pathname] = peers[pathname] || []
  const peer = peers[pathname].find((p) => p.peerId === peerId)
  if (peer) {
    peer.name = name
  }
  // console.log("change-name", pathname, peerId, name, peers);
  res.send({ msg: 'success' })
})

app.post(prefixPath + 'note-change', (req, res) => {
  const { pathname, data } = req.body
  content[pathname] = data
  res.send({ msg: 'success' })
})

app.post(prefixPath + 'board-change', (req, res) => {
  const { pathname, boardPaths } = req.body
  board[pathname] = boardPaths
  res.send({ msg: 'success' })
})

let peerServer
// console.log(
//   'process.env.VITE_SECURE',
//   process.env.VITE_SECURE,
//   typeof process.env.VITE_SECURE,
// )
if (process.env.VITE_SECURE === 'false') {
  const server = app.listen(process.env.VITE_PORT)
  peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
  })
} else if (process.env.VITE_SECURE === 'true') {
  const server = https
    .createServer(
      {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
      },
      app,
    )
    .listen(process.env.VITE_PORT)
  peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    sslkey: fs.readFileSync(process.env.SSL_KEY),
    sslcert: fs.readFileSync(process.env.SSL_CERT),
  })
}

peerServer.on('disconnect', (client) => {
  // console.log("peer disconnected", client.id);
  Object.keys(peers).forEach((room) => {
    peers[room] = peers[room].filter((peer) => peer.peerId !== client.id)

    if (!peers[room].length) {
      delete peers[room]
    }
  })
})

app.use(process.env.VITE_PEER_PATH + 'peerjs', peerServer)

console.log('server start')
