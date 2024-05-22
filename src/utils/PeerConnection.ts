import { DataConnection } from 'peerjs'
import { peer } from './peer'
import { peersAtom, store } from '../atom'
import { CanvasPath } from 'react-sketch-canvas'

type PeerStatus = 'connectting' | 'connected' | 'self'

export interface PeerData {
  peerId: string
  name: string
  conn: DataConnection
  board?: CanvasPath[]
}

class PeerConnection {
  peerId: string
  name: string
  status: PeerStatus
  conn: DataConnection
  board?: CanvasPath[]

  constructor(data: PeerData) {
    // console.log("PeerConnection created", data);
    this.peerId = data.peerId
    this.name = data.name
    this.conn = data.conn
    if (this.peerId === peer.id) {
      this.status = 'self'
      return
    }
    this.board = data.board

    // if (data.conn) {
    // console.log("conn exist", this.conn);
    if (this.conn.open) {
      this.status = 'connected'
    } else {
      this.status = 'connectting'
    }
    // } else {
    //   this.status = 'connectting'
    //   this.conn = peer.connect(this.peerId)
    //   initConn(this.conn)
    // }
  }

  setName(name: string) {
    store.set(peersAtom, (old) => {
      //   console.log("store set old", old);
      return old.map((peer: PeerConnection) => {
        // console.log("setName", name, peer, this.peerId);
        if (peer.peerId === this.peerId) {
          peer.name = name
        }
        return peer
      })
    })
  }

  setStatus(status: PeerStatus) {
    store.set(peersAtom, (old) =>
      old.map((peer: PeerConnection) => {
        if (peer.peerId === this.peerId) {
          peer.status = status
        }
        return peer
      }),
    )
  }
}

export default PeerConnection
