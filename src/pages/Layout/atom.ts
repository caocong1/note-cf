import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const pageLoadingAtom = atom(true)

export const componentAtom = atomWithStorage(
  'component',
  localStorage.getItem('component') || 'note',
)
