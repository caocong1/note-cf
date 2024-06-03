import { PeerServer } from 'peer'

const port =
  process.env.VITE_PEER_SERVER_PORT || process.env.VITE_PEER_PORT || 9000

const peerServer = PeerServer({
  port,
  allow_discovery: true,
})

peerServer.on('connection', (client) => {
  console.log('client connected----', client.id)
})

peerServer.on('disconnect', (client) => {
  console.log('client disconnect----', client.id)
})

console.log('peer server running on port ' + port)
