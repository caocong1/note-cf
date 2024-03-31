import Koa from 'koa';
import { Server } from 'socket.io'
import http from 'http';
import cors from '@koa/cors';

let input = {}
let peers = {}
let streamingPeerId

const app = new Koa();
const server = http.createServer(app.callback());
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: true,
});
app.use(cors());

io.on('connection', socket => {
    let uuid
    let room
    console.log('connection')

    socket.on('join', (res) => {
        console.log('join', res)
        uuid = res.uuid
        room = res.room
        peers[room] = peers[room] || []
        peers[room] = [...new Set([...peers[room], uuid])]
        // io.emit('update-peers', peers[room])
        socket.emit('init', { input: input[room], peers: peers[room] })
    })

    socket.on('input-change', ({ msg }) => {
        input[room] = msg
        // socket.broadcast.emit('update-input', {peerId, msg})
    })

    socket.on('start-stream', id => {
        console.log('start-stream', id)
        streamingPeerId = id
        socket.broadcast.emit('start-streaming', id)
    })
    socket.on('stop-stream', id => {
        console.log('stop-stream', id)
        streamingPeerId = ''
        socket.broadcast.emit('stop-streaming')
        // socket.broadcast.emit('streaming', id)
    })

    socket.on('remove-peer', peerId => {
        // console.log('remove-peer', peerId)
        peers[room] = peers[room].filter(peer => peer !== peerId)
        if (streamingPeerId === uuid) {
            streamingPeerId = ''
            socket.broadcast.emit('stop-streaming')
        }
    })

    // socket.on('disconnect', () => {
    //     console.log('disconnect', uuid)
    //     peers[room] = peers[room].filter(peer => peer !== uuid)
    //     io.emit('update-peers', peers[room])
    //     if (streamingPeerId === uuid) {
    //         streamingPeerId = ''
    //         socket.broadcast.emit('stop-streaming')
    //     }
    // })

    // socket.on('get-peers', () => {
    //     io.emit('update-peers-conn', peers[room])
    // })
})

server.listen(23335, () => {
    console.log('listening on *:23335');
});
