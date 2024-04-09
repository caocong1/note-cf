import express from 'express'
import { ExpressPeerServer } from 'peer'
import cors from 'cors'
import https from 'https'
import fs from 'fs'

let peers = {}
let content = {}
let board = {}

const app = express()

app.use(express.json({ limit: '100mb' }))
app.use(cors())

app.post('/get-peers', (req, res) => {
  // console.log(req.body);
  res.json(peers[req.body.pathname] || [])
})

app.post('/add-peer', (req, res) => {
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

app.post('/get-peer', (req, res) => {
  const { pathname, peerId } = req.body
  // console.log("get-peer", pathname, peerId);
  peers[pathname] = peers[pathname] || []
  const peer = peers[pathname].find((p) => p.peerId === peerId)
  res.send(peer)
})

app.post('/change-name', (req, res) => {
  const { pathname, peerId, name } = req.body
  peers[pathname] = peers[pathname] || []
  const peer = peers[pathname].find((p) => p.peerId === peerId)
  if (peer) {
    peer.name = name
  }
  // console.log("change-name", pathname, peerId, name, peers);
  res.send({ msg: 'success' })
})

app.post('/note-change', (req, res) => {
  const { pathname, data } = req.body
  content[pathname] = data
  res.send({ msg: 'success' })
})

app.post('/board-change', (req, res) => {
  const { pathname, boardPaths } = req.body
  board[pathname] = boardPaths
  res.send({ msg: 'success' })
})

// const server = app.listen(23335)
const server = https
  .createServer(
    {
      key: fs.readFileSync('C:\\love2c.cc_nginx\\love2c.cc.key'),
      cert: fs.readFileSync('C:\\love2c.cc_nginx\\love2c.cc_bundle.crt'),
    },
    app,
  )
  .listen(23335)

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  sslkey: fs.readFileSync('C:\\love2c.cc_nginx\\love2c.cc.key'),
  sslcert: fs.readFileSync('C:\\love2c.cc_nginx\\love2c.cc_bundle.crt'),
})

// peerServer.on('connection', (client) => {
//     console.log('peer connected', client.id)
//  });

peerServer.on('disconnect', (client) => {
  // console.log("peer disconnected", client.id);
  Object.keys(peers).forEach((room) => {
    peers[room] = peers[room].filter((peer) => peer.peerId !== client.id)

    if (!peers[room].length) {
      delete peers[room]
    }
  })
})

app.use('/peerjs', peerServer)

console.log('server start')
