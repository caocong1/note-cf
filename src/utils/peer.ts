import Peer, { DataConnection } from 'peerjs'
import { myNameAtom, myPeerIdAtom, peersAtom, store } from '../atom'
import PeerConnection, { PeerData } from './PeerConnection'
import { Modal, notification } from 'antd'
import request from '../request'
import { remoteStreamDataAtom, streamingDataAtom } from '../pages/Screen/atom'
import { pageLoadingAtom } from '../pages/Layout/atom'
import {
  clearBoard,
  jsonAddToBoard,
  removeBoardObject,
} from '@/pages/Board/util'
import {
  clearScreenBoard,
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

export const roomName = decodeURI(location.pathname)

export let peer: Peer

export function initPeer() {
  const myPeerId = store.get(myPeerIdAtom)
  peer = new Peer(myPeerId, {
    host: import.meta.env.VITE_HOST || location.hostname,
    port: import.meta.env.VITE_PORT || location.port,
    secure: import.meta.env.VITE_SECURE ? (import.meta.env.VITE_SECURE === 'true') : location.protocol === 'https:',
    path: import.meta.env.VITE_PEER_PATH + 'peerjs',
    config: {
      iceServers: [
        { urls: 'stun:freestun.net:5350' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    },
  })

  peer.on('open', function (id) {
    console.log('My peer ID is: ' + id)
    const name = store.get(myNameAtom)
    request('add-peer', { pathname: roomName, peerId: id, name }).then(
      (res) => {
        // console.log("add-peer", res);
        const { peers, content, board: boardPath } = res
        store.set(
          peersAtom,
          peers.map((peer: PeerData) => new PeerConnection(peer)),
        )
        // store.set(contentAtom, content);
        noteChange(content)
        store.set(pageLoadingAtom, false)
        boardPath?.length && jsonAddToBoard(boardPath)
        // boardChange(boardPath[myPeerId]);
      },
    )
  })

  peer.on('connection', function (conn) {
    // console.log("peer connected", conn.peer);
    if (conn.peer === myPeerId) return
    const peers = store.get(peersAtom)
    const index = peers.findIndex(
      (peer: PeerConnection) => peer.peerId === conn.peer,
    )
    if (index === -1) {
      request('get-peer', {
        pathname: roomName,
        peerId: conn.peer,
      }).then((res) => {
        if (res) {
          addNewPeer({ ...res, conn })
        }
      })
      initConn(conn)
    }
  })

  peer.on('call', function (call) {
    // console.log('peer call', call, call.peer, peer.id)
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
          const peer = peers.find((p) => p.peerId === call.peer)
          return [
            ...o,
            { id: call.peer, name: peer?.name, stream: remoteStream },
          ]
        }
      })
    })
  })

  peer.on('error', function (e) {
    console.error(e)
    if (e.message.includes('is taken')) {
      Modal.confirm({
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
    return isExist ? old : [...old, new PeerConnection(res)]
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

export function initConn(conn: DataConnection) {
  conn.on('open', () => {
    console.log('connect open', conn.peer)
    store.set(peersAtom, (old) =>
      old.map((peer: PeerConnection) => {
        if (peer.peerId === conn.peer) {
          peer.status = 'connected'
        }
        return peer
      }),
    )
    const streamingData = store.get(streamingDataAtom)
    const myPeerId = store.get(myPeerIdAtom)
    if (streamingData.id === myPeerId) {
      peer.call(conn.peer, streamingData.stream!)
    }
    // this.setStatus("connected");
    conn!.on('data', (res: any) => {
      // console.log("conn data", conn.peer, res);
      const { type, data } = res
      //   console.log("conn data", this.peerId, type, data);
      switch (type) {
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
          downloadFile(data)
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
      }
    })
  })
  conn.on('close', () => {
    // console.log("conn close", conn.peer);
    removePeer(conn.peer)
    const streamingData = store.get(streamingDataAtom)
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
    if (streamingData.id === conn.peer) {
      resetVideo()
    }
  })
  conn.on('error', () => {
    // console.log("conn close", this.peerId);
    removePeer(conn.peer)
    const streamingData = store.get(streamingDataAtom)
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer))
    if (streamingData.id === conn.peer) {
      resetVideo()
    }
  })
}

function removePeer(peerId: string) {
  store.set(peersAtom, (old) =>
    old.filter((peer: PeerConnection) => peer.peerId !== peerId),
  )
}
