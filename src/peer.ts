import Peer from "peerjs";
import {
  myNameAtom,
  pageLoadingAtom,
  peersAtom,
  remoteStreamDataAtom,
  streamingDataAtom,
  store,
} from "./atom";
import PeerConnection, {
  PeerData,
  initConn,
  jsonAddToBoard,
  noteChange,
} from "./PeerConnection";
import { notification } from "antd";
import request from "./request";
import { FabricImage, Canvas } from "fabric";

export const myPeerId = localStorage.myPeerId || crypto.randomUUID();
export const roomName = decodeURI(location.pathname);

if (!localStorage.myPeerId) {
  localStorage.myPeerId = myPeerId;
}

export let peer: Peer;

const host = import.meta.env.VITE_HOST;
const path = import.meta.env.VITE_PATH;
const port = import.meta.env.VITE_PORT;
const secure = import.meta.env.VITE_SECURE === "true";

export let video: HTMLVideoElement;
export let canvasVideo: FabricImage;
export let screenCanvas: Canvas;
export const initScreenCanvas = () => {
  const canvasEl = document.getElementById(
    "screen-canvas",
  ) as HTMLCanvasElement;
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight - 50;
  screenCanvas = new Canvas(canvasEl);
};
export const resetVideo = () => {
  video = document.createElement("video");
  video.width = window.outerWidth * window.devicePixelRatio;
  video.height = window.outerHeight * window.devicePixelRatio;
  canvasVideo = new FabricImage(video, {
    left: 0,
    top: 0,
    width: video.width,
    height: video.height,
    selectable: false,
  });
  screenCanvas.remove(...screenCanvas.getObjects());
  screenCanvas.add(canvasVideo);
  store.set(streamingDataAtom, {
    id: "",
    stream: null,
  });
};

// export let streamingId = "";
// export const setStreamId = (id: string) => {
//   streamingId = id;
// }

export function initPeer() {
  peer = new Peer(myPeerId, {
    host,
    port,
    secure,
    path:  path + "peerjs",
  });

  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    const name = store.get(myNameAtom);
    request("add-peer", { pathname: roomName, peerId: id, name }).then(
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

  peer.on("connection", function (conn) {
    // console.log("peer connected", conn.peer);
    if (conn.peer === myPeerId) return;
    const peers = store.get(peersAtom);
    const index = peers.findIndex(
      (peer: PeerConnection) => peer.peerId === conn.peer,
    );
    if (index === -1) {
      request("get-peer", {
        pathname: roomName,
        peerId: conn.peer,
      }).then((res) => {
        if (res) {
          addNewPeer({ ...res, conn });
        }
      });
      initConn(conn);
    }
  });

  peer.on("call", function (call) {
    // console.log('peer call', call, call.peer, peer.id)
    // if (streamingData.id === call.peer || streamingData.id === myPeerId) return;
    call.answer();
    call.on("stream", function (remoteStream) {
      // console.log('call stream', remoteStream)
      const peers = store.get(peersAtom);
      store.set(remoteStreamDataAtom, (o) => {
        const sIndex = o.findIndex((v) => v.id === call.peer);
        if (sIndex !== -1) {
          o[sIndex].stream = remoteStream;
          return [...o];
        } else {
          const peer = peers.find((p) => p.peerId === call.peer);
          return [...o, { id: call.peer, name: peer?.name, stream: remoteStream }];
        }
      });
      // Modal.destroyAll();
      // const peers = store.get(peersAtom);
      // const peer = peers.find((p) => p.peerId === call.peer);
      // Modal.confirm({
      //   title: "提示",
      //   content: `是否观看<${peer?.name}>的屏幕共享？`,
      //   onOk() {
      //     video.srcObject = remoteStream;
      //     video.play();
      //     streamingData.id = call.peer;
      //     streamingData.stream = remoteStream;
      //   },
      // });
    });
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

export function callToPeers(stream: any) {
  const peers = store.get(peersAtom);
  peers.forEach((p) => {
    if (p.peerId !== myPeerId && p.conn && p.status === "connected") {
      peer.call(p.peerId, stream);
    }
  });
}
