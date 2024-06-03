import { PeerServer } from 'peer'

const peerServer = PeerServer({
  port: 9000,
  key: 'note',
  allow_discovery: true,
})

peerServer.on('connection', (client) => {
  console.log('client connected----', client)
})

peerServer.on('disconnect', (client) => {
  console.log('client disconnect----', client)
})

console.log('peer server running on port 9000')