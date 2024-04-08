import { atom, createStore } from 'jotai'
import PeerConnection from './utils/PeerConnection'
import { atomWithStorage } from 'jotai/utils'

export const store = createStore()

export const myPeerIdAtom = atomWithStorage(
  'myPeerId',
  localStorage.getItem('myPeerId') || crypto.randomUUID(),
)

export const myNameAtom = atomWithStorage(
  'myName',
  localStorage.getItem('myName') || 'unknown',
)

export const peersAtom = atom<PeerConnection[]>([])
