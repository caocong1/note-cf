import { Button } from "antd";
import { callToPeers } from "./peer";
import { useEffect } from "react";
import * as fabric from "fabric";

const video = document.createElement("video");

let canvas: fabric.Canvas;

const Screen: React.FC = () => {
  // const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const screenCanvas = document.getElementById(
      "screen-canvas",
    ) as HTMLCanvasElement;

    screenCanvas.width = window.innerWidth;
    screenCanvas.height = window.innerHeight - 50;

    canvas = new fabric.Canvas(screenCanvas, { isDrawingMode: true });
    // resizeCanvas();
    // const video1 = new fabric.FabricImage(video, {
    //   // left: 0,
    //   // top: 0,
    //   // angle: -15,
    //   originX: "center",
    //   originY: "center",
    //   // objectCaching: false,
    // });
    // canvas.add(video1);
    // console.log(video1);
    // initBoardCanvas(canvasRef);

    function resizeCanvas() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 50;

      screenCanvas.width = newWidth;
      screenCanvas.height = newHeight;
      screenCanvas.style.width = newWidth + "px";
      screenCanvas.style.height = newHeight + "px";

      // 重置fabric画布的大小
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.calcOffset();
      canvas.renderAll();
    }

    window.addEventListener("resize", resizeCanvas);

    // fabric.util.requestAnimFrame(function render() {
    //   canvas.renderAll();
    //   fabric.util.requestAnimFrame(render);
    // });

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
        overflow: "auto",
      }}
    >
      <canvas id="screen-canvas" />
      {/* <video id="video" /> */}
      <Button
        id="share-screen-btn"
        style={{ position: "absolute", bottom: 70, right: 20 }}
        onClick={() => {
          navigator.mediaDevices
            .getDisplayMedia({
              video: true,
              audio: false,
            })
            .then(function (stream) {
              //console.log(stream, peers)
              callToPeers(stream);
              const video1 = new fabric.FabricImage(video, {
                left: 0,
                top: 0,
                // angle: -15,
                originX: "center",
                originY: "center",
                // objectCaching: false,
              });
              canvas.add(video1);
              console.log(video1, video1.getElement());
              (video1.getElement() as any).play();
              // const video = document.getElementById(
              //   "video",
              // ) as HTMLVideoElement;
              // if (video) {
              //   video.srcObject = stream;
              //   video.play();
              // }
              // showVideo(stream);
              // videoStream = stream;
              // PeerCallStream(peers);
              // streamingId = peer.id;
              // socket.emit("start-stream", peer.id);
              // const videoTrack = stream.getVideoTracks()[0];

              // videoTrack.onended = () => {
              //   if (streamingId === peer.id) {
              //     console.log("用户已停止屏幕共享");
              //     socket.emit("stop-stream", peer.id);
              //   } else {
              //     console.log("其他用户已停止屏幕共享");
              //   }
              //   // 这里可以执行一些清理或用户通知的操作
              //   stopStream();
              //   setOpenModal(false);
              //   setMinModal(false);
              //   playingPeerId = "";
              // };
            })
            .catch((e) => {
              console.log("getDisplayMedia error", e);
            });
        }}
      >
        共享屏幕
      </Button>
    </div>
  );
};

export default Screen;
