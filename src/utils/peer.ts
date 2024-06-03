import Peer, { DataConnection } from 'peerjs'
import { myPeerIdAtom, peersAtom, store } from '../atom'
import PeerConnection, { PeerData } from './PeerConnection'
import { remoteStreamDataAtom, streamingDataAtom } from '../pages/Screen/atom'
import { componentAtom, pageLoadingAtom } from '../pages/Layout/atom'
import {
  clearBoard,
  getBoardObjectsJson,
  jsonAddToBoard,
  removeBoardObject,
} from '@/pages/Board/util'
import {
  clearScreenBoard,
  playVideo,
  removeScreenBoardObject,
  resetVideo,
  screenJsonAddToBoard,
  stopScreen,
} from '@/pages/Screen/util'
import {
  addFile,
  downloadFile,
  removeFile,
  requestDownload,
  startReceiveFile,
} from '@/pages/File/util'
import { noteChange } from '@/pages/Note/util'
import { modal, notification } from '@/pages/Layout/Layout'
import { filesAtom } from '@/pages/File/atom'

export const roomName = decodeURI(location.pathname)

export let peer: Peer
const iceUsername = import.meta.env.VITE_ICEUSERNAME
const iceCredential = import.meta.env.VITE_ICECREDENTIAL
const selfHost = import.meta.env.VITE_PEER_SELF_HOST
console.log('selfHost', selfHost, typeof selfHost)
const host = import.meta.env.VITE_PEER_HOST
const port = import.meta.env.VITE_PEER_PORT
const secure = import.meta.env.VITE_PEER_SECURE
const iceServers = iceUsername
  ? [
      {
        urls: 'stun:stun.relay.metered.ca:80',
      },
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: iceUsername,
        credential: iceCredential,
      },
      {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: iceUsername,
        credential: iceCredential,
      },
      {
        urls: 'turn:global.relay.metered.ca:443',
        username: iceUsername,
        credential: iceCredential,
      },
      {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: iceUsername,
        credential: iceCredential,
      },
    ]
  : []

export function initPeer(myPeerId: string) {
  // const myPeerId = store.get(myPeerIdAtom)
  if (peer) {
    peer.destroy()
  }
  peer = new Peer(
    myPeerId,
    selfHost
      ? {
          // host,
          // port,
          // secure,
          host: host || location.hostname,
          port: port || location.port,
          secure: secure ? secure === 'true' : location.protocol === 'https:',
          // debug: 0,
          config: { iceServers },
        }
      : { config: { iceServers } },
  )
  // peer = new Peer(myPeerId, {
  //   host: import.meta.env.VITE_HOST || location.hostname,
  //   port: import.meta.env.VITE_PORT || location.port,
  //   secure: import.meta.env.VITE_SECURE
  //     ? import.meta.env.VITE_SECURE === 'true'
  //     : location.protocol === 'https:',
  //   path: import.meta.env.VITE_PEER_PATH + 'peerjs',
  //   config: {
  //     iceServers: [
  //       { urls: 'stun:freestun.net:5350' },
  //       { urls: 'stun:stun.cloudflare.com:3478' },
  //       { urls: 'stun:stun.l.google.com:19302' },
  //     ],
  //   },
  // })

  peer.on('open', function (id) {
    console.log('My peer ID is: ' + id)
    store.set(myPeerIdAtom, id)
    store.set(pageLoadingAtom, false)
    notification.success({ message: '连接Peerjs服务器成功' })
    const params = new URLSearchParams(location.search)
    const invitePeerId = params.get('peerId')
    // console.log('invitePeerId', invitePeerId)
    if (invitePeerId) {
      history.replaceState(null, '', location.origin + location.pathname)
      const conn = peer.connect(invitePeerId)
      connInit(conn)
    }
    peer.listAllPeers((data) => {
      console.log(data)
      const pIds = data?.filter((p: string) => p !== id)
      if (pIds?.length) {
        connectIds(pIds)
      }
    })
    // if (host) {
    //   fetch(`${secure ? 'https://' : 'http://'}${host}:${port}/peerjs/peers`)
    //     .then((res) => res.json())
    //     .then((data) => {
    //       console.log('peers', data)
    //       const pIds = data?.filter((p: string) => p !== id)
    //       if (pIds?.length) {
    //         connectIds(pIds)
    //       }
    //     })
    // } else {
    //   const pIds = sessionStorage.getItem('peerIds')?.split(',')
    //   if (pIds?.length) {
    //     connectIds(pIds)
    //   }
    // }

    // const name = store.get(myNameAtom)
    // request('add-peer', { pathname: roomName, peerId: id, name }).then(
    //   (res) => {
    //     // console.log("add-peer", res);
    //     const { peers, content, board: boardPath } = res
    //     peers.forEach((p: string) => {
    //       if (p !== id) {
    //         const conn = peer.connect(p)
    //         connInit(conn)
    //       }
    //     })
    //     // store.set(
    //     //   peersAtom,
    //     //   peers.map((p: PeerData) => new PeerConnection(p)),
    //     // )
    //     // store.set(contentAtom, content);
    //     noteChange(content)
    //     store.set(pageLoadingAtom, false)
    //     boardPath?.length && jsonAddToBoard(boardPath)
    //     // boardChange(boardPath[myPeerId]);
    //   },
    // )
  })

  peer.on('connection', function (conn) {
    if (conn.peer === myPeerId) return
    console.log('peer connection', conn.peer)
    connInit(conn)
    // if (index === -1) {
    //   request('get-peer', {
    //     pathname: roomName,
    //     peerId: conn.peer,
    //   }).then((res) => {
    //     if (res) {
    //       addNewPeer({ ...res, conn })
    //     }
    //   })
    //   initConn(conn)
    // }
  })

  peer.on('disconnected', function (conn) {
    console.log('peer disconnected', conn)
    // notification.error({ message: 'Peer连接断开' })
  })

  peer.on('call', function (call) {
    console.log('peer call', call)
    call.answer()
    call.on('stream', function (remoteStream) {
      // console.log('call stream', remoteStream)
      const peers = store.get(peersAtom)
      store.set(remoteStreamDataAtom, (o) => {
        const sIndex = o.findIndex((v) => v.id === call.peer)
        if (sIndex !== -1) {
          o[sIndex].stream = remoteStream
          return [...o]
        } else {
          const p = peers.find((p) => p.peerId === call.peer)
          const newStreamData = {
            id: call.peer,
            stream: remoteStream,
          }
          if (p) {
            modal.confirm({
              title: '提示',
              content: `是否接收来自< ${getNameFromId(call.peer)} >的屏幕共享`,
              onOk() {
                store.set(componentAtom, 'screen')
                playVideo(newStreamData)
              },
            })
          }
          return [...o, newStreamData]
        }
      })
    })
  })

  peer.on('error', function (e) {
    console.error(e, peer.id, myPeerId)
    if (e.message.includes('is taken')) {
      if (myPeerId === peer.id) {
        notification.error({ message: '昵称已被占用' })
        store.set(pageLoadingAtom, false)
      } else {
        modal.confirm({
          title: '提示',
          content: '同一浏览器只能开一个Note窗口',
          onOk() {
            window.close()
          },
          onCancel() {
            window.close()
          },
          closable: false,
        })
      }
    } else {
      notification.error({ message: 'Peer连接失败请重试，msg: ' + e.message })
    }
  })
}

function connInit(conn: DataConnection) {
  // console.log('conn init', conn, conn.open)
  conn.on('open', () => {
    console.log('connect open', conn)
    conn.send({
      type: 'get-peer-data',
      data: { roomName },
    })
    // store.set(peersAtom, (old) =>
    //   old.map((peer: PeerConnection) => {
    //     if (peer.peerId === conn.peer) {
    //       notification.info({ message: `< ${peer.name} >加入房间` })
    //       peer.status = 'connected'
    //     }
    //     return peer
    //   }),
    // )
    const streamingData = store.get(streamingDataAtom)
    const myPeerId = store.get(myPeerIdAtom)
    if (streamingData.id === myPeerId) {
      peer.call(conn.peer, streamingData.stream!)
    }
    // this.setStatus("connected");
  })
  conn.on('data', (res: any) => {
    console.log('conn data', conn.peer, res?.type)
    const { type, data } = res
    //   console.log("conn data", this.peerId, type, data);
    switch (type) {
      case 'get-peer-data':
        if (roomName === data.roomName) {
          conn.send({
            type: 'peer-data',
            data: {
              peers: store.get(peersAtom).map((p) => p.peerId),
              note: document.getElementById('content')?.innerHTML,
              files: store.get(filesAtom),
              board: getBoardObjectsJson(),
            },
          })
          addNewPeer({ peerId: conn.peer, conn })
        }
        break
      case 'peer-data':
        peerData(data, conn)
        break
      // case 'change-name':
      //   remotePeerNameChanged(data)
      //   break
      case 'note-change':
        noteChange(data)
        break
      case 'board-object-add':
        jsonAddToBoard([data])
        break
      case 'board-clear':
        clearBoard()
        break
      case 'board-object-remove':
        removeBoardObject(data)
        break
      case 'file-add':
        addFile(data)
        addFileNotice(data, conn.peer)
        break
      case 'file-remove':
        removeFile(data)
        break
      case 'request-download':
        requestDownload({ fileId: data, conn })
        break
      // case 'request-download-legacy':
      //   requestDownloadLegacy({ fileId: data, conn })
      //   break
      case 'send-file-start':
        startReceiveFile(data)
        break
      case 'send-file':
        downloadFile(data, conn)
        break
      case 'download-complete':
        downloadComplete(data)
        break
      case 'screen-stop':
        stopScreen(data)
        break
      case 'screen-board-object-add':
        screenJsonAddToBoard([data])
        break
      case 'screen-board-clear':
        clearScreenBoard()
        break
      case 'screen-board-object-remove':
        removeScreenBoardObject(data)
        break
      case 'peer-close':
        removePeer(data)
        break
    }
  })
  conn.on('close', () => {
    console.log('conn close', conn.peer)
    removePeer(conn.peer)
    const streamingData = store.get(streamingDataAtom)
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
    if (streamingData.id === conn.peer) {
      resetVideo()
    }
  })
  conn.on('error', (e) => {
    console.log('conn error', conn.peer, e)
    removePeer(conn.peer)
    const streamingData = store.get(streamingDataAtom)
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
    if (streamingData.id === conn.peer) {
      resetVideo()
    }
  })
  conn.on('iceStateChanged', (e) => {
    console.log('conn iceStateChanged', e)
    if (e === 'disconnected') {
      notification.error({ message: 'ICE连接断开：' + conn.peer })
      peer.connect(conn.peer)
      // conn.close()
      // const c = peer.connect(conn.peer)
      // connInit(c)
    }
  })
}
function peerData(
  {
    peers,
    note,
    files,
    board,
  }: { peers: string[]; note: string; files: any[]; board: any[] },
  conn: DataConnection,
) {
  addNewPeer({ peerId: conn.peer, conn })
  // store.set(remoteStreamDataAtom, (o) => {
  //   const sIndex = o.findIndex((v) => v.id === conn.peer)
  //   if (sIndex !== -1) {
  //     o[sIndex].name = name
  //     return [...o]
  //   } else {
  //     return o
  //   }
  // })
  connectIds(peers)
  const contentNode = document.getElementById('content')
  const nodeHtml = contentNode?.innerHTML
  if (contentNode && !nodeHtml && note) {
    contentNode.innerHTML = note
  }
  const filesData = store.get(filesAtom)
  if (!filesData?.length && files?.length) {
    store.set(filesAtom, files)
  }
  const boardData = getBoardObjectsJson()
  if (!boardData?.length && board?.length) {
    jsonAddToBoard(board)
  }
}

function connectIds(ids: string[]) {
  const peersData = store.get(peersAtom)
  const myPeerId = store.get(myPeerIdAtom)
  for (const id of ids) {
    if (!peersData.some((val) => val.peerId === id) && id !== myPeerId) {
      const conn = peer.connect(id)
      connInit(conn)
    }
  }
}

export function sendDataToPeers(data: { type: string; data: any }) {
  const peers = store.get(peersAtom)
  const myPeerId = store.get(myPeerIdAtom)
  peers.forEach((peer) => {
    if (peer.peerId !== myPeerId && peer.conn && peer.status === 'connected') {
      peer.conn.send(data)
    }
  })
}

function addNewPeer(res: PeerData) {
  store.set(peersAtom, (old) => {
    const isExist = old.some((peer) => peer.peerId === res.peerId)
    if (isExist) {
      return old
    } else {
      notification.success({
        message: `成功连接< ${getNameFromId(res.peerId)} >`,
      })
      return [...old, new PeerConnection(res)]
    }
  })
}

export function callToPeers(stream: any) {
  const peers = store.get(peersAtom)
  const myPeerId = store.get(myPeerIdAtom)
  peers.forEach((p) => {
    if (p.peerId !== myPeerId && p.conn && p.status === 'connected') {
      peer.call(p.peerId, stream)
    }
  })
}

// export function initConn(conn: DataConnection) {
//   conn.on('open', () => {
//     console.log('connect open', conn.peer)
//     store.set(peersAtom, (old) =>
//       old.map((peer: PeerConnection) => {
//         if (peer.peerId === conn.peer) {
//           notification.info({ message: `< ${peer.name} >加入房间` })
//           peer.status = 'connected'
//         }
//         return peer
//       }),
//     )
//     const streamingData = store.get(streamingDataAtom)
//     const myPeerId = store.get(myPeerIdAtom)
//     if (streamingData.id === myPeerId) {
//       peer.call(conn.peer, streamingData.stream!)
//     }
//     // this.setStatus("connected");
//     conn!.on('data', (res: any) => {
//       // console.log("conn data", conn.peer, res);
//       const { type, data } = res
//       //   console.log("conn data", this.peerId, type, data);
//       switch (type) {
//         case 'change-name':
//           remotePeerNameChanged(data)
//           break
//         case 'note-change':
//           noteChange(data)
//           break
//         case 'board-object-add':
//           jsonAddToBoard([data])
//           break
//         case 'board-clear':
//           clearBoard()
//           break
//         case 'board-object-remove':
//           removeBoardObject(data)
//           break
//         case 'file-add':
//           addFile(data)
//           addFileNotice(data, conn.peer)
//           break
//         case 'file-remove':
//           removeFile(data)
//           break
//         case 'request-download':
//           requestDownload({ fileId: data, conn })
//           break
//         case 'request-download-legacy':
//           requestDownloadLegacy({ fileId: data, conn })
//           break
//         case 'send-file-start':
//           startReceiveFile(data)
//           break
//         case 'send-file':
//           downloadFile(data, conn)
//           break
//         case 'download-complete':
//           downloadComplete(data)
//           break
//         case 'screen-stop':
//           stopScreen(data)
//           break
//         case 'screen-board-object-add':
//           screenJsonAddToBoard([data])
//           break
//         case 'screen-board-clear':
//           clearScreenBoard()
//           break
//         case 'screen-board-object-remove':
//           removeScreenBoardObject(data)
//           break
//         case 'peer-close':
//           removePeer(data)
//           break
//       }
//     })
//   })
//   conn!.on('data', (res: any) => {
//     console.log('conn data outside', conn.peer, res)
//   })
//   conn.on('close', () => {
//     console.log('conn close', conn.peer)
//     removePeer(conn.peer)
//     const streamingData = store.get(streamingDataAtom)
//     store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
//     if (streamingData.id === conn.peer) {
//       resetVideo()
//     }
//   })
//   conn.on('error', (e) => {
//     console.log('conn error', conn.peer, e)
//     removePeer(conn.peer)
//     const streamingData = store.get(streamingDataAtom)
//     store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
//     if (streamingData.id === conn.peer) {
//       resetVideo()
//     }
//   })
// }

function removePeer(peerId: string) {
  store.set(peersAtom, (old) => {
    const p = old.find((peer: PeerConnection) => peer.peerId === peerId)
    if (p?.status === 'connected') {
      notification.info({ message: `< ${getNameFromId(p.peerId)} >离开房间` })
    }
    return old.filter((peer: PeerConnection) => peer.peerId !== peerId)
  })
}

window.addEventListener('beforeunload', () => {
  const myPeerId = store.get(myPeerIdAtom)
  sendDataToPeers({ type: 'peer-close', data: myPeerId })
})

function addFileNotice(data: any, peerId: string) {
  notification.success({
    message: `< ${getNameFromId(peerId)} >分享了文件${
      data.type === 'directory' ? '夹' : ''
    }[ ${data.name} ]`,
  })
}

function downloadComplete(data: { fileId: string; peerId: string }) {
  const fileData = store.get(filesAtom).find((f) => f.id === data.fileId)
  if (fileData) {
    notification.success({
      message: `< ${getNameFromId(data.peerId)} >下载文件${
        fileData.type === 'directory' ? '夹' : ''
      }[ ${fileData.name} ]完成`,
    })
  }
}

export function connectToPeer(peerId: string) {
  const c = peer.connect(peerId)
  connInit(c)
}

export function getNameFromId(id: string) {
  return decodeURI(atob(id))
}

export function getIdFromName(name: string) {
  return btoa(encodeURI(name))
}
