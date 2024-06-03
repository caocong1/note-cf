import { PeerServer } from 'peer'

const port = process.env.PORT || 9000
const key = process.env.VITE_PEER_KEY || 'note'

const peerServer = PeerServer({
  port,
  key,
  allow_discovery: true,
})

peerServer.on('connection', (client) => {
  console.log('client connected----', client)
})

peerServer.on('disconnect', (client) => {
  console.log('client disconnect----', client)
})

console.log('peer server running on port ' + port)
