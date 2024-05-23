import Peer, { DataConnection } from 'peerjs'
import { myNameAtom, myPeerIdAtom, peersAtom, store } from '../atom'
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
import { remotePeerNameChanged } from '@/pages/Layout/util'
import {
  addFile,
  downloadFile,
  removeFile,
  requestDownload,
  requestDownloadLegacy,
  startReceiveFile,
} from '@/pages/File/util'
import { noteChange } from '@/pages/Note/util'
import { modal, notification } from '@/pages/Layout/Layout'
import { filesAtom } from '@/pages/File/atom'

export const roomName = decodeURI(location.pathname)

export let peer: Peer

export function initPeer() {
  const myPeerId = store.get(myPeerIdAtom)
  peer = new Peer(myPeerId)
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
    } else {
      const pIds = sessionStorage.getItem('peerIds')?.split(',')
      if (pIds?.length) {
        connectIds(pIds)
      }
    }
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
            name: p?.name,
            stream: remoteStream,
          }
          if (p) {
            modal.confirm({
              title: '提示',
              content: `是否接收来自< ${p?.name} >的屏幕共享`,
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
    console.error(e)
    if (e.message.includes('is taken')) {
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
    } else {
      notification.error({ message: 'Peer连接失败请重试，msg: ' + e.message })
    }
  })
}

function connInit(conn: DataConnection) {
  console.log('conn init', conn)
  conn.on('open', () => {
    console.log('connect open', conn)
    conn.send({
      type: 'get-peer-data',
      data: { roomName, name: store.get(myNameAtom) },
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
    console.log('conn data', conn.peer, res)
    const { type, data } = res
    //   console.log("conn data", this.peerId, type, data);
    switch (type) {
      case 'get-peer-data':
        if (roomName === data.roomName) {
          conn.send({
            type: 'peer-data',
            data: {
              name: store.get(myNameAtom),
              peers: store.get(peersAtom).map((p) => p.peerId),
              note: document.getElementById('content')?.innerHTML,
              files: store.get(filesAtom),
              board: getBoardObjectsJson(),
            },
          })
          addNewPeer({ peerId: conn.peer, name: data.name, conn })
        }
        break
      case 'peer-data':
        peerData(data, conn)
        break
      case 'change-name':
        remotePeerNameChanged(data)
        break
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
      case 'request-download-legacy':
        requestDownloadLegacy({ fileId: data, conn })
        break
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
}
function peerData(
  { name, peers, note, files, board }: any,
  conn: DataConnection,
) {
  addNewPeer({ peerId: conn.peer, name, conn })
  store.set(remoteStreamDataAtom, (o) => {
    const sIndex = o.findIndex((v) => v.id === conn.peer)
    if (sIndex !== -1) {
      o[sIndex].name = name
      return [...o]
    } else {
      return o
    }
  })
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
      notification.success({ message: `成功连接< ${res.name} >` })
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
    const peer = old.find((peer: PeerConnection) => peer.peerId === peerId)
    if (peer?.status === 'connected') {
      notification.info({ message: `< ${peer.name} >离开房间` })
    }
    return old.filter((peer: PeerConnection) => peer.peerId !== peerId)
  })
}

window.addEventListener('beforeunload', () => {
  const myPeerId = store.get(myPeerIdAtom)
  sendDataToPeers({ type: 'peer-close', data: myPeerId })
})

function addFileNotice(data: any, peerId: string) {
  const peer = store.get(peersAtom).find((p) => p.peerId === peerId)
  if (peer)
    notification.success({
      message: `< ${peer.name} >分享了文件${
        data.type === 'directory' ? '夹' : ''
      }[ ${data.name} ]`,
    })
}

function downloadComplete(data: { fileId: string; peerId: string }) {
  const peer = store.get(peersAtom).find((p) => p.peerId === data.peerId)
  const fileData = store.get(filesAtom).find((f) => f.id === data.fileId)
  if (peer && fileData) {
    notification.success({
      message: `< ${peer.name} >下载文件${
        fileData.type === 'directory' ? '夹' : ''
      }[ ${fileData.name} ]完成`,
    })
  }
}
