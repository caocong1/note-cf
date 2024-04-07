import { atom, createStore } from "jotai";
import PeerConnection from "./PeerConnection";
import { atomWithStorage, splitAtom } from "jotai/utils";

export const store = createStore();

export const myPeerIdAtom = atomWithStorage(
  "myPeerId",
  localStorage.getItem("myPeerId") || crypto.randomUUID(),
);

export const myNameAtom = atomWithStorage(
  "myName",
  localStorage.getItem("myName") || "unknown",
);

export const peersAtom = atom<PeerConnection[]>([]);

export const peerAtomsAtom = splitAtom(peersAtom);

// export const contentAtom = atom("");

export const pageLoadingAtom = atom(true);

export const pathItemsAtom = atom<any[]>([]);

export const componentAtom = atomWithStorage(
  "component",
  localStorage.getItem("component") || "note",
);

export const boardDragAtom = atom(false);

export const filesAtom = atom<any[]>([]);
