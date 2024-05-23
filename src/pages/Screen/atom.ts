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

export const isPenModeAtom = atom(false)

export const showAlertAtom = atom(false)
