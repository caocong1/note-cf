import { Button } from "antd";
import { callToPeers } from "./peer";
import { useEffect } from "react";
import * as fabric from "fabric";

const video = document.createElement("video");
// const video = document.getElementById("video") as HTMLVideoElement;
const videoWidth = window.outerWidth * window.devicePixelRatio;
const videoHeight = window.outerHeight * window.devicePixelRatio;
video.width = videoWidth;
video.height = videoHeight;
// document.body.appendChild(video);
let canvas: fabric.Canvas;

const Screen: React.FC = () => {
  // const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const screenCanvas = document.getElementById(
      "screen-canvas",
    ) as HTMLCanvasElement;

    // const video = document.getElementById("video") as HTMLVideoElement;
    // video!.width = window.innerWidth;
    // video!.height = window.innerHeight - 50;

    screenCanvas.width = window.innerWidth;
    screenCanvas.height = window.innerHeight - 50;

    canvas = new fabric.Canvas(screenCanvas);
    // resizeCanvas();
    const video1 = new fabric.FabricImage(video, {
      left: 0,
      top: 0,
      width: videoWidth,
      height: videoHeight,
      // angle: -15,
      // originX: "center",
      // originY: "center",
      // objectCaching: false,
      selectable: false,
    });
    canvas.add(video1);
    // console.log(video1);
    // initBoardCanvas(canvasRef);
    canvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY; // 滚轮，向上滚一下是 -100，向下滚一下是 100
      let zoom = canvas.getZoom(); // 获取画布当前缩放值
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20; // 限制最大缩放级别
      if (zoom < 0.01) zoom = 0.01; // 限制最小缩放级别

      // 以鼠标所在位置为原点缩放
      const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(
        point,
        zoom, // 传入修改后的缩放级别
      );
    });
    let mouseDown = false;
    canvas.on("mouse:up", () => {
      // console.log("mouse:up", e);
      mouseDown = false;
    });
    canvas.on("mouse:down", () => {
      // console.log("mouse:down", e);
      mouseDown = true;
    });
    canvas.on("mouse:move", (e) => {
      // console.log("mouse:move", e);
      // const drag = store.get(boardDragAtom);
      const event: any = e?.e;
      if (mouseDown && event) {
        const point = new fabric.Point(event.movementX, event.movementY);
        canvas.relativePan(point);
      }
    });

    function resizeCanvas() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 50;

      // video.width = newWidth;
      // video.height = newHeight;
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

    console.log(video.videoWidth, video.videoHeight);
    fabric.util.requestAnimFrame(function render() {
      // if (
      //   videoWidth !== video.videoWidth ||
      //   videoHeight !== video.videoHeight
      // ) {
      //   videoWidth = video.videoWidth;
      //   videoHeight = video.videoHeight;
      //   video1.width = videoWidth;
      //   video1.height = videoHeight;
      // }
      // console.log(videoWidth, videoHeight);
      canvas.renderAll();
      fabric.util.requestAnimFrame(render);
    });

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
              console.log(stream);
              callToPeers(stream);
              video.srcObject = stream;
              video.play();
              // const video1 = new fabric.FabricImage(video, {
              //   left: 0,
              //   top: 0,
              //   // angle: -15,
              //   originX: "center",
              //   originY: "center",
              //   // objectCaching: false,
              // });
              // canvas.add(video1);
              // console.log(video1, video1.getElement());
              // (video1.getElement() as any).play();
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
