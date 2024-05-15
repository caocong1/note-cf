import { myPeerIdAtom, store } from '@/atom'
import { FabricImage, Canvas, Point, util } from 'fabric'
import { StreamData, remoteStreamDataAtom, streamingDataAtom } from './atom'
import { notification } from 'antd'
import { sendDataToPeers } from '@/utils/peer'

let video: HTMLVideoElement
// export let canvasVideo: FabricImage
let screenCanvas: Canvas

const initScreenCanvas = () => {
  if (screenCanvas) {
    window.removeEventListener('resize', resizeCanvas)
    screenCanvas.dispose()
  }
  const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
  canvasEl.width = window.innerWidth
  canvasEl.height = window.innerHeight - 50
  screenCanvas = new Canvas(canvasEl)
  screenCanvas.on('mouse:wheel', (opt) => {
    const delta = opt.e.deltaY // 滚轮，向上滚一下是 -100，向下滚一下是 100
    let zoom = screenCanvas.getZoom() // 获取画布当前缩放值
    zoom *= 0.999 ** delta
    if (zoom > 20) zoom = 20 // 限制最大缩放级别
    if (zoom < 0.01) zoom = 0.01 // 限制最小缩放级别

    // 以鼠标所在位置为原点缩放
    const point = new Point(opt.e.offsetX, opt.e.offsetY)
    console.log('zoom', zoom)
    screenCanvas.zoomToPoint(
      point,
      zoom, // 传入修改后的缩放级别
    )
  })
  let mouseDown = false
  screenCanvas.on('mouse:up', () => {
    // console.log("mouse:up", e);
    mouseDown = false
  })
  screenCanvas.on('mouse:down', () => {
    // console.log("mouse:down", e);
    mouseDown = true
  })
  screenCanvas.on('mouse:move', (e) => {
    // console.log("mouse:move", e);
    const event: any = e?.e
    if (mouseDown && event) {
      const point = new Point(event.movementX, event.movementY)
      screenCanvas.relativePan(point)
    }
  })

  function resizeCanvas() {
    const newWidth = window.innerWidth
    const newHeight = window.innerHeight - 50

    const canvasEl = document.getElementById(
      'screen-canvas',
    ) as HTMLCanvasElement
    canvasEl.width = newWidth
    canvasEl.height = newHeight
    canvasEl.style.width = newWidth + 'px'
    canvasEl.style.height = newHeight + 'px'

    // 重置fabric画布的大小
    screenCanvas.width = newWidth
    screenCanvas.height = newHeight
    screenCanvas.calcOffset()
    screenCanvas.renderAll()
  }

  window.addEventListener('resize', resizeCanvas)

  util.requestAnimFrame(function render() {
    screenCanvas.renderAll()
    util.requestAnimFrame(render)
  })
}

export const resetVideo = () => {
  // video = document.createElement('video')
  // video.width = window.outerWidth * window.devicePixelRatio
  // video.height = window.outerHeight * window.devicePixelRatio
  // canvasVideo = new FabricImage(video, {
  //   left: 0,
  //   top: 0,
  //   width: video.width,
  //   height: video.height,
  //   selectable: false,
  // })
  notification.warning({ message: '屏幕共享结束' })
  const streamingData = store.get(streamingDataAtom)
  const myPeerId = store.get(myPeerIdAtom)
  if (streamingData.id === myPeerId) {
    sendDataToPeers({
      type: 'screen-stop',
      data: { peerId: myPeerId },
    })
  }
  if (screenCanvas) {
    screenCanvas.remove(...screenCanvas.getObjects())
  }
  // screenCanvas.add(canvasVideo)
  store.set(streamingDataAtom, {
    id: '',
    stream: null,
  })
}

export function playVideo(data: StreamData) {
  // const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
  // canvasEl.width = window.innerWidth
  // canvasEl.height = window.innerHeight - 50
  // screenCanvas = new Canvas(canvasEl)
  initScreenCanvas()
  video = document.createElement('video')
  video.srcObject = data.stream
  video.onloadedmetadata = () => {
    const myPeerId = store.get(myPeerIdAtom)
    if (data.id === myPeerId) {
      video.width = video.videoWidth * window.devicePixelRatio
      video.height = video.videoHeight * window.devicePixelRatio
    } else {
      video.width = video.videoWidth
      video.height = video.videoHeight
    }
    const canvasVideo = new FabricImage(video, {
      left: 0,
      top: 0,
      width: video.width,
      height: video.height,
      selectable: false,
    })
    const widthRadio = window.innerWidth / video.width
    const heightRadio = (window.innerHeight - 50) / video.height
    const zoom = Math.min(widthRadio, heightRadio)
    const point = new Point(0, 0)
    screenCanvas.zoomToPoint(point, zoom)
    screenCanvas.add(canvasVideo)
    video.play()
    store.set(streamingDataAtom, data)
  }
  const tracks = data.stream?.getTracks()
  if (tracks?.length) {
    tracks[0].onended = () => {
      // console.log('video.onended')
      resetVideo()
    }
  }
}

export function restoreSize() {
  const widthRadio = window.innerWidth / video.width
  const heightRadio = (window.innerHeight - 50) / video.height
  const zoom = Math.min(widthRadio, heightRadio)
  const point = new Point(0, 0)
  screenCanvas.absolutePan(point)
  screenCanvas.zoomToPoint(point, zoom)
}

export function stopScreen(data: any) {
  const { peerId } = data
  const streamingData = store.get(streamingDataAtom)
  const myPeerId = store.get(myPeerIdAtom)
  if (peerId !== myPeerId) {
    store.set(remoteStreamDataAtom, (o) => o.filter((v) => v.id !== peerId))
    if (streamingData.id === peerId) {
      resetVideo()
    }
  }
}

// async function getStreamDimensions(stream: MediaStream) {
//   // const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
//   const video = document.createElement('video')
//   video.style.display = 'none'
//   document.body.appendChild(video)
//   video.srcObject = stream

//   return new Promise((resolve) => {
//     video.onloadedmetadata = () => {
//       resolve({ width: video.videoWidth, height: video.videoHeight })
//       document.body.removeChild(video)
//     }
//   })
// }
