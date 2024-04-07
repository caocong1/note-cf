import Peer from "peerjs";
import { myNameAtom, pageLoadingAtom, peersAtom, store } from "./atom";
import PeerConnection, {
  PeerData,
  initConn,
  jsonAddToBoard,
  noteChange,
} from "./PeerConnection";
import { notification } from "antd";
import request from "./request";

export const myPeerId = localStorage.myPeerId || crypto.randomUUID();

if (!localStorage.myPeerId) {
  localStorage.myPeerId = myPeerId;
}

export let peer: Peer;

const host = import.meta.env.VITE_HOST;
const port = import.meta.env.VITE_PORT;
const secure = import.meta.env.VITE_SECURE === "true";

export function initPeer() {
  peer = new Peer(myPeerId, {
    host,
    port,
    secure,
    path: "/peerjs",
  });

  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    const name = store.get(myNameAtom);
    request("add-peer", { pathname: location.pathname, peerId: id, name }).then(
      (res) => {
        // console.log("add-peer", res);
        const { peers, content, board: boardPath } = res;
        store.set(
          peersAtom,
          peers.map((peer: PeerData) => new PeerConnection(peer)),
        );
        // store.set(contentAtom, content);
        noteChange(content);
        store.set(pageLoadingAtom, false);
        boardPath?.length && jsonAddToBoard(boardPath);
        // boardChange(boardPath[myPeerId]);
      },
    );
  });

  peer.on("call", function (call) {
    console.log("peer call", call, call.peer, peer.id);
    //   if (playingPeerId === call.peer) return;
    //   call.answer();
    //   call.on("stream", function (remoteStream) {
    //     // console.log('call stream', remoteStream)
    //     Modal.destroyAll();
    //     Modal.confirm({
    //       title: "提示",
    //       content: "是否观看远程桌面共享？",
    //       onOk() {
    //         stopStream();
    //         setOpenModal(false);
    //         setMinModal(false);
    //         playingPeerId = call.peer;
    //         showVideo(remoteStream);
    //       },
    //     });
    //   });
  });

  peer.on("connection", function (conn) {
    console.log("peer connected", conn.peer);
    if (conn.peer === myPeerId) return;
    const peers = store.get(peersAtom);
    const index = peers.findIndex(
      (peer: PeerConnection) => peer.peerId === conn.peer,
    );
    if (index === -1) {
      request("get-peer", {
        pathname: location.pathname,
        peerId: conn.peer,
      }).then((res) => {
        if (res) {
          addNewPeer({ ...res, conn });
        }
      });
      initConn(conn);
    }
  });

  peer.on("error", function (e) {
    console.error(e);
    notification.error({ message: "Peer连接失败请重试" });
  });
}

export function sendDataToPeers(data: { type: string; data: any }) {
  const peers = store.get(peersAtom);
  peers.forEach((peer) => {
    if (peer.peerId !== myPeerId && peer.conn && peer.status === "connected") {
      peer.conn.send(data);
    }
  });
}

function addNewPeer(res: PeerData) {
  store.set(peersAtom, (old) => {
    const isExist = old.some((peer) => peer.peerId === res.peerId);
    return isExist ? old : [...old, new PeerConnection(res)];
  });
}
