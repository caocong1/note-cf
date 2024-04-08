import { store, peersAtom } from '@/atom'
import PeerConnection from '@/utils/PeerConnection'

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
}
