import { store, peersAtom } from '@/atom'
import PeerConnection from '@/utils/PeerConnection'
import { remoteStreamDataAtom } from '../Screen/atom'

export function remotePeerNameChanged(data: { peerId: string; name: string }) {
  const { peerId, name } = data
  store.set(peersAtom, (old) =>
    old.map((peer: PeerConnection) => {
      if (peer.peerId === peerId) {
        peer.name = name
      }
      return peer
    }),
  )
  store.set(remoteStreamDataAtom, (old) =>
    old.map((peer) => {
      if (peer.id === peerId) {
        peer.name = name
      }
      return peer
    }),
  )
}
