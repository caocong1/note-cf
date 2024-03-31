import Koa  from 'koa';
import {Server} from 'socket.io'
import http from 'http';
import cors from '@koa/cors';

let input
let peers = []
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
    console.log('connection')
    // socket.join(uuid)
    // io.to(uuid).emit('init', {uuid, input})
    // let peerId: string

    socket.on('join', id => {
        console.log('join', id)
        uuid = id
        peers.push(uuid)
        socket.emit('init', {input, peers})
        io.emit('update-peers', peers)
    })

    socket.on('input-change', ({peerId, msg}) => {
        input = msg
        socket.broadcast.emit('update-input', {peerId, msg})
    })

    // socket.on('add-peer', id => {
    //     console.log('new peer', id)
    //     peerId = id
    //     // socket.join(peerId)
    //     peers.push(peerId)
    //     socket.emit('init', input)
    //     io.emit('update-peers', peers)
    //     console.log('peers', peers)
    //     // socket.broadcast.except(uuid).emit('update-input', msg)
    // })

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

    socket.on('disconnect', () => {
        console.log('disconnect', uuid)
        peers = peers.filter(peer => peer !== uuid)
        io.emit('update-peers', peers)
        if (streamingPeerId === uuid) {
            streamingPeerId = ''
            socket.broadcast.emit('stop-streaming')
        }
    })
})

server.listen(2096, () => {
    console.log('listening on *:2096');
});
