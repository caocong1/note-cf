import React, { useEffect, useRef } from "react";
import { canvas, initBoardCanvas } from "./PeerConnection";
import { Button } from "antd";
import ClearOutlined from "@ant-design/icons/lib/icons/ClearOutlined";
import { sendDataToPeers } from "./peer";

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      canvas.width = newWidth;
      canvas.height = newHeight;
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
