import { DataConnection } from "peerjs";
import { peer } from "./peer";
import { peersAtom, store } from "./atom";

type PeerStatus = "connectting" | "connected" | "self";

export interface PeerData {
  peerId: string;
  name: string;
  conn?: DataConnection;
}

class PeerConnection {
  peerId: string;
  name: string;
  status: PeerStatus;
  conn?: DataConnection;

  constructor(data: PeerData) {
    // console.log("PeerConnection created", data);
    this.peerId = data.peerId;
    this.name = data.name;
    if (this.peerId === peer.id) {
      this.status = "self";
      return;
    }
    this.status = "connectting";
    // if (data.conn) {
    //   console.log("conn exist", this.peerId);
    // } else {
    //   console.log("start connect", this.peerId);
    // }
    this.conn = data.conn || peer.connect(this.peerId);
    this.conn.on("open", () => {
      //   console.log("connect open", this.peerId);
      this.setStatus("connected");
      this.conn!.on("data", (res: any) => {
        // console.log("conn data", this.peerId, res);
        const { type, data } = res;
        //   console.log("conn data", this.peerId, type, data);
        switch (type) {
          case "change-name":
            remotePeerNameChanged(data);
            break;
          case "note-change":
            noteChange(data);
            break;
        }
      });
      //   this.conn!.send({ type: "hello" });
    });
    this.conn.on("close", () => {
      removePeer(this.peerId);
    });
    this.conn.on("error", () => {
      removePeer(this.peerId);
    });
  }

  setName(name: string) {
    store.set(peersAtom, (old) => {
      //   console.log("store set old", old);
      return old.map((peer: PeerConnection) => {
        // console.log("setName", name, peer, this.peerId);
        if (peer.peerId === this.peerId) {
          peer.name = name;
        }
        return peer;
      });
    });
  }

  setStatus(status: PeerStatus) {
    store.set(peersAtom, (old) =>
      old.map((peer: PeerConnection) => {
        if (peer.peerId === this.peerId) {
          peer.status = status;
        }
        return peer;
      }),
    );
  }
}

export default PeerConnection;

function remotePeerNameChanged(data: { peerId: string; name: string }) {
  const { peerId, name } = data;
  store.set(peersAtom, (old) =>
    old.map((peer: PeerConnection) => {
      if (peer.peerId === peerId) {
        peer.name = name;
      }
      return peer;
    }),
  );
}

function removePeer(peerId: string) {
  store.set(peersAtom, (old) =>
    old.filter((peer: PeerConnection) => peer.peerId !== peerId),
  );
}

// export function initConnData(peer: PeerConnection) {
//     peer.setStatus("connected");
//     peer.conn!.on("data", (res: any) => {
//       console.log("conn data", peer.peerId, res);
//       const { type, data } = res;
//       //   console.log("conn data", this.peerId, type, data);
//       switch (type) {
//         case "change-name":
//           remotePeerNameChanged(data);
//           break;
//       }
//     });
//     peer.conn?.send("hello");
// }

export function noteChange(data: string) {
  //   store.set(contentAtom, data);
  const content = document.getElementById("content")!;
  content.innerHTML = data;
}
