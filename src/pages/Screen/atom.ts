import { atom } from 'jotai'

export interface StreamData {
  id: string
  name?: string
  stream: MediaStream | null
}

export const streamingDataAtom = atom<StreamData>({
  id: '',
  stream: null,
})

export const remoteStreamDataAtom = atom<StreamData[]>([])
