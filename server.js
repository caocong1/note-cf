import Koa  from 'koa';
import {Server} from 'socket.io'

let input
let peers = []
let streamingPeerId

const app = new Koa();

app.use(async ctx => {
    ctx.body = 'Hello World';
});

app.listen(23335);