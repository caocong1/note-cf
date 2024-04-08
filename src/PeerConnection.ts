import { DataConnection } from "peerjs";
import { myPeerId, peer, resetVideo, sendDataToPeers } from "./peer";
import {
  filesAtom,
  peersAtom,
  remoteStreamDataAtom,
  store,
  streamingDataAtom,
} from "./atom";
import { boardRef } from "./util/useBoardRef";
import { CanvasPath } from "react-sketch-canvas";
import * as fabric from "fabric";
import request from "./request";

type PeerStatus = "connectting" | "connected" | "self";

export interface PeerData {
  peerId: string;
  name: string;
  conn?: DataConnection;
  board?: CanvasPath[];
}

class PeerConnection {
  peerId: string;
  name: string;
  status: PeerStatus;
  conn?: DataConnection;
  board?: CanvasPath[];

  constructor(data: PeerData) {
    // console.log("PeerConnection created", data);
    this.peerId = data.peerId;
    this.name = data.name;
    if (this.peerId === peer.id) {
      this.status = "self";
      return;
    }
    this.board = data.board;
    // if (data.conn) {
    //   console.log("conn exist", this.peerId);
    // } else {
    //   console.log("start connect", this.peerId);
    // }
    if (data.conn) {
      this.conn = data.conn;
      // console.log("conn exist", this.conn);
      if (this.conn.open) {
        this.status = "connected";
      } else {
        this.status = "connectting";
      }
    } else {
      this.status = "connectting";
      this.conn = peer.connect(this.peerId);
      initConn(this.conn);
    }
    // this.conn.on("open", () => {
    //   console.log("connect open", this.peerId);
    //   this.setStatus("connected");
    //   this.conn!.on("data", (res: any) => {
    //     console.log("conn data", this.peerId, res);
    //     const { type, data } = res;
    //     //   console.log("conn data", this.peerId, type, data);
    //     switch (type) {
    //       case "change-name":
    //         remotePeerNameChanged(data);
    //         break;
    //       case "note-change":
    //         noteChange(data);
    //         break;
    //       case "board-change":
    //         boardChange(data);
    //         break;
    //     }
    //   });
    //   //   this.conn!.send({ type: "hello" });
    // });
    // this.conn.on("close", () => {
    //   console.log("conn close", this.peerId);
    //   removePeer(this.peerId);
    // });
    // this.conn.on("error", () => {
    //   // console.log("conn close", this.peerId);
    //   removePeer(this.peerId);
    // });
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

export function remotePeerNameChanged(data: { peerId: string; name: string }) {
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

export let boardChanging = false;
export const setBordChanging = (value: boolean) => {
  boardChanging = value;
};
export let latestBoardPath: CanvasPath[];
export const setLatestBoardPath = (value: CanvasPath[]) => {
  latestBoardPath = value;
};
export function boardChange(data: CanvasPath[] | undefined) {
  boardChanging = true;
  if (data?.length) {
    boardRef?.current?.loadPaths(data);
  }
  setTimeout(() => {
    boardChanging = false;
  }, 1000);
  // const component = store.get(componentAtom);
  // latestBoardPath = data;
  // if (component !== "board" || boardChanging) {
  //   setTimeout(() => {
  //     boardChange(latestBoardPath);
  //   }, 500);
  //   return;
  // }
  // boardChanging = true;
  // boardRef?.current?.loadPaths(latestBoardPath);
  // setTimeout(() => {
  //   boardChanging = false;
  // }, 100);
}

export function initConn(conn: DataConnection) {
  conn.on("open", () => {
    // console.log("connect open", conn.peer);
    store.set(peersAtom, (old) =>
      old.map((peer: PeerConnection) => {
        if (peer.peerId === conn.peer) {
          peer.status = "connected";
        }
        return peer;
      }),
    );
    const streamingData = store.get(streamingDataAtom);
    if (streamingData.id === myPeerId) {
      peer.call(conn.peer, streamingData.stream!);
    }
    // this.setStatus("connected");
    conn!.on("data", (res: any) => {
      // console.log("conn data", conn.peer, res);
      const { type, data } = res;
      //   console.log("conn data", this.peerId, type, data);
      switch (type) {
        case "change-name":
          remotePeerNameChanged(data);
          break;
        case "note-change":
          noteChange(data);
          break;
        case "board-object-add":
          jsonAddToBoard([data]);
          break;
        case "board-clear":
          canvas.clear();
          saveBoard();
          break;
        case "board-object-remove":
          removeBoardObject(data);
          break;
        case "file-add":
          addFile(data);
          break;
        case "file-remove":
          removeFile(data);
          break;
        case "request-download":
          requestDownload({ fileId: data, conn });
          break;
        case "send-file-start":
          startReceiveFile(data);
          break;
        case "send-file":
          downloadFile(data);
          break;
        case "screen-stop":
          stopScreen(data);
          break;
      }
    });
    //   this.conn!.send({ type: "hello" });
  });
  conn.on("close", () => {
    // console.log("conn close", conn.peer);
    removePeer(conn.peer);
    const streamingData = store.get(streamingDataAtom);
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer));
    if (streamingData.id === conn.peer) {
      resetVideo();
    }
  });
  conn.on("error", () => {
    // console.log("conn close", this.peerId);
    removePeer(conn.peer);
    const streamingData = store.get(streamingDataAtom);
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== conn.peer));
    if (streamingData.id === conn.peer) {
      resetVideo();
    }
  });
}

export let canvas: fabric.Canvas;
export const setCanvas = (value: fabric.Canvas) => {
  canvas = value;
};

export function jsonAddToBoard(json: any) {
  fabric.util.enlivenObjects(json).then((objects) => {
    objects.forEach(function (o: any) {
      canvas.add(o);
    });
  });
}

export function initBoardCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  canvas = new fabric.Canvas(canvasRef.current!, {
    isDrawingMode: true,
    stopContextMenu: true,
    fireMiddleClick: true,
    fireRightClick: true,
  });
  const pencilBrush = new fabric.PencilBrush(canvas);
  pencilBrush.color = "red";
  pencilBrush.width = 10;
  canvas.freeDrawingBrush = pencilBrush;

  canvas.on("path:created", function (e: any) {
    // console.log("path:created", e);
    const newPath = e.path;
    const id = crypto.randomUUID();
    e.path.set({ id });

    const json = newPath.toJSON();
    sendDataToPeers({ type: "board-object-add", data: { ...json, id } });
    saveBoard();
  });
  canvas.on("mouse:wheel", (opt) => {
    const delta = opt.e.deltaY; // 滚轮，向上滚一下是 -100，向下滚一下是 100
    let zoom = canvas.getZoom(); // 获取画布当前缩放值
    zoom *= 0.99 ** delta;
    if (zoom > 20) zoom = 20; // 限制最大缩放级别
    if (zoom < 0.01) zoom = 0.01; // 限制最小缩放级别

    // 以鼠标所在位置为原点缩放
    const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
    canvas.zoomToPoint(
      point,
      zoom, // 传入修改后的缩放级别
    );
  });
  // canvas拖拽
  let isMiddleMouseDown = false;
  canvas.on("mouse:up", (e: any) => {
    // console.log("mouse:up", e);
    // const drag = store.get(boardDragAtom);
    if (e.e.button === 1) {
      isMiddleMouseDown = false;
    }
  });
  canvas.on("mouse:down", (e: any) => {
    // console.log("mouse:down", e);
    // const drag = store.get(boardDragAtom);
    if (e.e.button === 1) {
      isMiddleMouseDown = true;
    }
    if (e.e.button === 2) {
      // console.log(e.target, canvas.getObjects());
      canvas.remove(e.target);
      sendDataToPeers({ type: "board-object-remove", data: e.target.id });
      saveBoard();
    }
  });
  canvas.on("mouse:move", (e) => {
    // console.log("mouse:move", e);
    // const drag = store.get(boardDragAtom);
    const event: any = e?.e;
    if (isMiddleMouseDown && event) {
      const point = new fabric.Point(event.movementX, event.movementY);
      canvas.relativePan(point);
    }
  });
}

function removeBoardObject(data: any) {
  const removeObject = canvas.getObjects().find((o: any) => o.id === data);
  removeObject && canvas.remove(removeObject);
}

export function saveBoard() {
  const objects = canvas.getObjects();
  request("board-change", {
    pathname: location.pathname,
    boardPaths: objects.map((o: any) => ({ ...o.toJSON(), id: o.id })),
  });
}

function addFile(file: any) {
  store.set(filesAtom, (old) => [...old, file]);
}

function removeFile(id: any) {
  store.set(filesAtom, (old) => old.filter((f) => f.id !== id));
}

const chunkSize = 1024 * 1024 * 2;
async function requestDownload(data: any) {
  const { conn, fileId } = data;
  const files = store.get(filesAtom);
  const fileData = files.find((f) => f.id === fileId);
  if (fileData.type === "file" && fileData.fileHandle) {
    const file = await fileData.fileHandle.getFile();
    conn.send({
      type: "send-file-start",
      data: { fileId, size: file.size },
    });
    const buffer = await file.arrayBuffer();
    const size = buffer.byteLength;
    let start = 0;
    let end = size > chunkSize ? chunkSize : size;
    let sendBuffer = buffer.slice(start, end);
    while (sendBuffer.byteLength > 0) {
      conn.send({
        type: "send-file",
        data: {
          fileId,
          buffer: sendBuffer,
          // start,
          end,
          // size,
        },
      });
      start = end;
      end = size > start + chunkSize ? start + chunkSize : size;
      sendBuffer = buffer.slice(start, end);
    }
  } else if (
    fileData.type === "directory" &&
    fileData.dirHandle &&
    fileData.subFiles?.length
  ) {
    // const files = fileData.subFiles.map((fh: any) => ({
    //   name: fh.name,
    // }));
    for await (const subFile of fileData.subFiles) {
      const file = await subFile.fileHandle.getFile();
      // const relativePaths = await fileData.dirHandle.resolve(
      //   subFile.fileHandle,
      // );
      conn.send({
        type: "send-file-start",
        data: {
          fileId,
          downloadingId: subFile.id,
          size: file.size,
        },
      });
      const buffer = await file.arrayBuffer();
      const size = buffer.byteLength;
      let start = 0;
      let end = size > chunkSize ? chunkSize : size;
      let sendBuffer = buffer.slice(start, end);
      while (sendBuffer.byteLength > 0) {
        conn.send({
          type: "send-file",
          data: {
            fileId,
            downloadingId: subFile.id,
            buffer: sendBuffer,
            end,
          },
        });
        start = end;
        end = size > start + chunkSize ? start + chunkSize : size;
        sendBuffer = buffer.slice(start, end);
      }
    }
  }
}

async function startReceiveFile(data: any) {
  const { fileId, size } = data;
  const filesData = store.get(filesAtom);
  const fileData = filesData.find((f) => f.id === fileId);
  if (fileData?.type === "file") {
    store.set(filesAtom, (o) =>
      o.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            downloading: {
              totalSize: size,
            },
          };
        }
        return f;
      }),
    );
  } else if (fileData?.type === "directory") {
    const { downloadingId } = data;
    // const startFile = fileData.subFiles.find(
    //   (f: any) => f.id === downloadingId,
    // );
    // const writable = await createFileWritable(
    //   fileData.dirHandle,
    //   startFile.name,
    //   startFile.relativePaths,
    // );

    store.set(filesAtom, (o) =>
      o.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            downloading: true,
            subFiles: f.subFiles.map((f: any) => {
              if (f.id === downloadingId) {
                return { ...f, totalSize: size };
              }
              return f;
            }),
          };
        }
        return f;
      }),
    );
  }
}

export async function createFileWritable(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  relativePaths: string[],
) {
  let currentDirectory = directoryHandle;
  for (const part of relativePaths) {
    currentDirectory = await currentDirectory.getDirectoryHandle(part, {
      create: true,
    });
  }

  const fileHandle = await currentDirectory.getFileHandle(fileName, {
    create: true,
  });

  const writable = await fileHandle.createWritable();

  return writable;
}

function downloadFile(data: any) {
  const { fileId, conn, buffer, end } = data;
  const files = store.get(filesAtom);
  const fileData = files.find((f) => f.id === fileId);
  if (fileData?.type === "file" && fileData.writable) {
    fileData.writable.write(buffer).then(() => {
      if (fileData.downloading.totalSize === end) {
        fileData.writable.close();
      }
      store.set(filesAtom, (o) =>
        o.map((f) => {
          if (f.id === fileId) {
            return {
              ...f,
              downloading: {
                ...f.downloading,
                end,
              },
            };
          }
        }),
      );
    });
  } else if (fileData?.type === "directory") {
    const { downloadingId } = data;
    const subFile = fileData.subFiles.find((f: any) => f.id === downloadingId);
    if (subFile) {
      subFile.writable.write(buffer).then(() => {
        if (subFile.totalSize === end) {
          subFile.writable.close();
        }
        store.set(filesAtom, (o) =>
          o.map((f) => {
            if (f.id === fileId) {
              return {
                ...f,
                subFiles: f.subFiles.map((sf: any) => {
                  if (sf.id === downloadingId) {
                    return { ...sf, end };
                  }
                  return sf;
                }),
              };
            }
          }),
        );
      });
    }
  } else {
    conn.send({
      type: "send-file-error",
      data: fileId,
    });
  }
}

export async function getFilesRecursively(directoryHandle: any) {
  const files = [];
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "file") {
      files.push(entry);
    } else if (entry.kind === "directory") {
      const subFiles: any = await getFilesRecursively(entry);
      files.push(...subFiles);
    }
  }
  return files;
}

function stopScreen(data: any) {
  const { peerId } = data;
  const streamingData = store.get(streamingDataAtom);
  if (peerId !== myPeerId) {
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== peerId));
    if (streamingData.id === peerId) {
      resetVideo();
    }
  }
}
