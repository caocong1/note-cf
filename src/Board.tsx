import React, { useEffect, useRef } from "react";
import { canvas, initBoardCanvas } from "./PeerConnection";
import { useAtom } from "jotai";
import { boardDragAtom } from "./atom";
import { Button } from "antd";
import ClearOutlined from "@ant-design/icons/lib/icons/ClearOutlined";
import { sendDataToPeers } from "./peer";

const Board: React.FC = () => {
  // const ref = useBoardRef();
  // const peers = useAtomValue(peersAtom);
  // const peersSplitAtoms = splitAtom(peersAtom);
  // const peersAtoms = useAtomValue(peersSplitAtoms);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const drag = useAtomValue(boardDragAtom);

  useEffect(() => {
    canvasRef.current!.width = window.innerWidth;
    canvasRef.current!.height = window.innerHeight - 50;

    initBoardCanvas(canvasRef);

    function resizeCanvas() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 50;

      canvasRef.current!.width = newWidth;
      canvasRef.current!.height = newHeight;
      canvasRef.current!.style.width = newWidth + "px";
      canvasRef.current!.style.height = newHeight + "px";

      // 重置fabric画布的大小
      canvas.setWidth(newWidth);
      canvas.setHeight(newHeight);
      canvas.calcOffset();
      canvas.renderAll();
    }

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.dispose();
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "calc(100vh - 50px)",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100vw", height: "calc(100vh - 50px)" }}
      />
      <ToolBar />
    </div>
  );
};

export default Board;

const ToolBar: React.FC = () => {
  // const [drag, setDrag] = useAtom(boardDragAtom);

  return (
    <div style={{ position: "absolute", right: 16, bottom: 16 }}>
      <Button
        type={"dashed"}
        icon={<ClearOutlined />}
        onClick={() => {
          canvas.clear();
          sendDataToPeers({ type: "board-clear", data: {} });
          // setDrag(!drag);
          // canvas.isDrawingMode = drag;
          // for (let i = 0; i < canvas.getObjects().length; i++) {
          //   canvas.item(i).selectable = drag;
          // }
        }}
      />
    </div>
  );
};

// async function syncBoard() {
//   const component = store.get(componentAtom);
//   if (component !== "board") return;
//   const data = (await boardRef?.current?.exportPaths()) || [];
//   sendDataToPeers({ type: "board-change", data });
//   await request("board-change", {
//     pathname: location.pathname,
//     data,
//   });
//   window.requestAnimationFrame(syncBoard);
// }

// const PeerBoard: React.FC<{ peerAtom: PrimitiveAtom<PeerConnection> }> = ({
//   peerAtom,
// }) => {
//   const peerBoardRef = useRef<ReactSketchCanvasRef>(null);
//   const peer = useAtomValue(peerAtom);

//   useEffect(() => {
//     if (peer.peerId === myPeerId) return;
//     if (peer.board?.length) {
//       peerBoardRef.current?.loadPaths(peer.board);
//     } else {
//       peerBoardRef.current?.clearCanvas();
//     }
//   }, [peer.board, peer.peerId]);

//   return (
//     peer.peerId !== myPeerId && (
//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           width: "100vw",
//           height: "calc(100vh - 50px)",
//         }}
//       >
//         <ReactSketchCanvas
//           ref={peerBoardRef}
//           width="100%"
//           height="100%"
//           canvasColor="transparent"
//           strokeColor="#a855f7"
//         />
//       </div>
//     )
//   );
// };
