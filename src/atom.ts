import { atom, createStore } from 'jotai'
import PeerConnection from './utils/PeerConnection'
import { atomWithStorage } from 'jotai/utils'

export const store = createStore()

export const myPeerIdAtom = atomWithStorage(
  'myPeerId',
  localStorage.getItem('myPeerId')?.replace(/"/g, '') || crypto.randomUUID(),
)

export const myNameAtom = atomWithStorage(
  'myName',
  localStorage.getItem('myName')?.replace(/"/g, '') || 'unknown',
)

export const peersAtom = atom<PeerConnection[]>([])

// setInterval(() => {
//   const peers = store.get(peersAtom)
//   peers.forEach((peer) => {
//     console.log(peer.name, peer.status)
//   })
// }, 5000)
