import { myPeerIdAtom, peersAtom, store } from '@/atom'
import { FabricImage, Canvas, Point, util, PencilBrush } from 'fabric'
import {
  StreamData,
  remoteStreamDataAtom,
  showAlertAtom,
  streamingDataAtom,
} from './atom'
import { sendDataToPeers } from '@/utils/peer'
import { notification } from '../Layout/Layout'

let video: HTMLVideoElement
// export let canvasVideo: FabricImage
export let screenCanvas: Canvas
let checkVideoSizeInterval: any
export let screenPencilBrush: PencilBrush

// const checkVideoSizeDebounce = debounce(checkVideoSize, 200)

export function screenJsonAddToBoard(json: any) {
  util.enlivenObjects(json).then((objects) => {
    objects.forEach(function (o: any) {
      screenCanvas.add(o)
    })
  })
}

export function removeScreenBoardObject(data: any) {
  const removeObject = screenCanvas.getObjects().find((o: any) => o.id === data)
  removeObject && screenCanvas.remove(removeObject)
}

function resizeCanvas() {
  const newWidth = window.innerWidth
  const newHeight = window.innerHeight - 50

  const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
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

const resize = debounce(resizeCanvas, 200)

let canvasRequestAnimFrame: number

function initScreenCanvas() {
  // if (screenCanvas) {
  //   window.removeEventListener('resize', resizeCanvas)
  //   screenCanvas.dispose()
  // }
  unsubscribeEvent()
  const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
  canvasEl.width = window.innerWidth
  canvasEl.height = window.innerHeight - 50
  screenCanvas = new Canvas(canvasEl, {
    isDrawingMode: true,
    stopContextMenu: true,
    fireMiddleClick: true,
    fireRightClick: true,
  })
  screenPencilBrush = new PencilBrush(screenCanvas)
  screenPencilBrush.color = 'red'
  screenPencilBrush.width = 10
  screenCanvas.freeDrawingBrush = screenPencilBrush

  screenCanvas.on('path:created', function (e: any) {
    // console.log("path:created", e);
    const newPath = e.path
    const id = crypto.randomUUID()
    e.path.set({ id })

    const json = newPath.toJSON()
    sendDataToPeers({ type: 'screen-board-object-add', data: { ...json, id } })
    // saveScreenBoard()
  })

  screenCanvas.on('mouse:wheel', (opt) => {
    const delta = opt.e.deltaY // 滚轮，向上滚一下是 -100，向下滚一下是 100
    let zoom = screenCanvas.getZoom() // 获取画布当前缩放值
    zoom *= 0.999 ** delta
    if (zoom > 20) zoom = 20 // 限制最大缩放级别
    if (zoom < 0.01) zoom = 0.01 // 限制最小缩放级别

    // 以鼠标所在位置为原点缩放
    const point = new Point(opt.e.offsetX, opt.e.offsetY)
    // console.log('zoom', zoom)
    screenCanvas.zoomToPoint(
      point,
      zoom, // 传入修改后的缩放级别
    )
  })
  let mouseDownButton: number | null = null
  screenCanvas.on('mouse:up', () => {
    // console.log("mouse:up", e);
    // mouseDown = false
    mouseDownButton = null
  })
  screenCanvas.on('mouse:down', (e: any) => {
    // console.log("mouse:down", e);
    // const isPenMode = store.get(isPenModeAtom)
    // if (!isPenMode) {
    //   mouseDown = true
    // }
    mouseDownButton = e.e.button
    if (e.e.button === 2 && e.target && e.target.id) {
      // console.log(e.target, canvas.getObjects());
      screenCanvas.remove(e.target)
      sendDataToPeers({ type: 'screen-board-object-remove', data: e.target.id })
      // saveScreenBoard()
    }
  })
  screenCanvas.on('mouse:move', (e) => {
    // console.log("mouse:move", e);
    const event: any = e?.e
    if (mouseDownButton && event) {
      const point = new Point(event.movementX, event.movementY)
      screenCanvas.relativePan(point)
    }
  })

  window.addEventListener('resize', resize)

  canvasRequestAnimFrame = util.requestAnimFrame(function render() {
    screenCanvas.renderAll()
    canvasRequestAnimFrame = util.requestAnimFrame(render)
  })
}
function unsubscribeEvent() {
  window.removeEventListener('resize', resize)
  // console.log('destroyScreenCanvas', screenCanvas, canvasRequestAnimFrame)
  screenCanvas && screenCanvas.dispose()
  canvasRequestAnimFrame && util.cancelAnimFrame(canvasRequestAnimFrame)
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
  if (checkVideoSizeInterval) {
    clearInterval(checkVideoSizeInterval)
  }
  // notification.warning({ message: '屏幕共享结束' })
  const streamingData = store.get(streamingDataAtom)
  const myPeerId = store.get(myPeerIdAtom)
  if (streamingData.id === myPeerId) {
    sendDataToPeers({
      type: 'screen-stop',
      data: { peerId: myPeerId },
    })
    const tracks = streamingData.stream?.getTracks()
    if (tracks?.length) {
      tracks[0].stop()
    }
  }
  if (screenCanvas) {
    screenCanvas.remove(...screenCanvas.getObjects())
  }
  // screenCanvas.add(canvasVideo)
  store.set(streamingDataAtom, {
    id: '',
    stream: null,
  })
  video = document.createElement('video')
  unsubscribeEvent()
}

let canvasVideo: FabricImage
export function playVideo(data: StreamData) {
  // const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
  // canvasEl.width = window.innerWidth
  // canvasEl.height = window.innerHeight - 50
  // screenCanvas = new Canvas(canvasEl)
  if (!localStorage.notShowAlert) {
    store.set(showAlertAtom, true)
  }
  initScreenCanvas()
  video = document.createElement('video')
  // document.body.appendChild(video)
  video.srcObject = data.stream
  video.onloadedmetadata = () => {
    // console.log('onloadedmetadata', video.videoWidth, video.videoHeight)
    // console.log(video.videoWidth, video.videoHeight, window.devicePixelRatio)
    // const myPeerId = store.get(myPeerIdAtom)
    // if (data.id === myPeerId) {
    //   video.width = video.videoWidth * window.devicePixelRatio
    //   video.height = video.videoHeight * window.devicePixelRatio
    // } else {
    //   video.width = video.videoWidth
    //   video.height = video.videoHeight
    // }
    // canvasVideo = new FabricImage(video, {
    //   left: 0,
    //   top: 0,
    //   width: video.width,
    //   height: video.height,
    //   selectable: false,
    // })
    // const widthRadio = window.innerWidth / video.width
    // const heightRadio = (window.innerHeight - 50) / video.height
    // const zoom = Math.min(widthRadio, heightRadio)
    // const point = new Point(0, 0)
    // console.log(
    //   'add canvasVideo',
    //   video.videoHeight,
    //   video.height,
    //   window.innerHeight - 50,
    //   window.devicePixelRatio,
    //   zoom,
    // )
    // screenCanvas.zoomToPoint(point, zoom)
    video.width = video.videoWidth
    video.height = video.videoHeight
    canvasVideo = new FabricImage(video, {
      left: 0,
      top: 0,
      width: video.videoWidth,
      height: video.videoHeight,
      selectable: false,
    })
    // restoreSize()
    screenCanvas.add(canvasVideo)
    video.play()
    store.set(streamingDataAtom, data)
    // checkVideoSizeInterval = setInterval(checkVideoSize, 1000)
  }
  video.onresize = () => {
    // console.log('video.onresize')
    // const myPeerId = store.get(myPeerIdAtom)
    // if (data.id === myPeerId) {
    //   video.width = video.videoWidth * window.devicePixelRatio
    //   video.height = video.videoHeight * window.devicePixelRatio
    // } else {
    //   video.width = video.videoWidth
    //   video.height = video.videoHeight
    // }
    // if (canvasVideo) {
    //   // video.width = video.videoWidth
    //   // video.height = video.videoHeight
    //   const myPeerId = store.get(myPeerIdAtom)
    //   if (data.id === myPeerId) {
    //     video.width = video.videoWidth * window.devicePixelRatio
    //     video.height = video.videoHeight * window.devicePixelRatio
    //   } else {
    //     video.width = video.videoWidth
    //     video.height = video.videoHeight
    //   }
    //   // canvasVideo.width = video.width
    //   // canvasVideo.height = video.height
    // }
    restoreSize()
  }
  const tracks = data.stream?.getTracks()
  if (tracks?.length) {
    // console.log('track', tracks[0])
    tracks[0].onended = () => {
      // console.log('video.onended')
      resetVideo()
    }
  }
}

export function restoreSize() {
  // const myPeerId = store.get(myPeerIdAtom)
  // const streamingData = store.get(streamingDataAtom)
  // if (streamingData.id === myPeerId) {
  //   video.width = video.videoWidth * window.devicePixelRatio
  //   video.height = video.videoHeight * window.devicePixelRatio
  // } else {
  //   video.width = video.videoWidth
  //   video.height = video.videoHeight
  // }
  // console.log(
  //   'restoreSize',
  //   canvasVideo,
  //   video.width,
  //   video.videoWidth,
  //   canvasVideo?.width,
  // )
  if (!canvasVideo) {
    return
  }
  if (
    video.width !== video.videoWidth ||
    video.height !== video.videoHeight ||
    video.width !== canvasVideo.width ||
    video.height !== canvasVideo.height
  ) {
    video.width = video.videoWidth
    video.height = video.videoHeight
    canvasVideo.width = video.width
    canvasVideo.height = video.height
  }
  // console.log('restoreSize', video.width, video.videoWidth, canvasVideo.width)
  // video.width = video.videoWidth
  // video.height = video.videoHeight
  // canvasVideo.width = video.width
  // canvasVideo.height = video.height
  const widthRadio = window.innerWidth / video.width
  const heightRadio = (window.innerHeight - 50) / video.height
  const zoom = Math.min(widthRadio, heightRadio)
  // console.log(
  //   'restoreSize',
  //   video.videoHeight,
  //   video.height,
  //   canvasVideo.height,
  //   window.innerHeight - 50,
  //   window.devicePixelRatio,
  //   zoom,
  // )
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
      const peers = store.get(peersAtom)
      const peer = peers.find((p) => p.peerId === peerId)
      notification.warning({ message: `< ${peer?.name} >停止共享屏幕` })
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

// function checkVideoSize() {
//   const streamingData = store.get(streamingDataAtom)
//   if (streamingData.stream) {
//     getStreamDimensions(streamingData.stream).then((size: any) => {
//       if (size.width === video.width && size.height === video.height) {
//         return
//       }
//       // console.log('video size change')
//       video.width = size.width
//       video.height = size.height
//       const canvasVideo = new FabricImage(video, {
//         left: 0,
//         top: 0,
//         width: video.width,
//         height: video.height,
//         selectable: false,
//       })
//       screenCanvas.remove(...screenCanvas.getObjects())
//       screenCanvas.add(canvasVideo)
//     })
//   }
// }

function debounce(func: any, wait: number) {
  let timeout: any
  return function (...args: any) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// export function saveScreenBoard() {
//   const objects = screenCanvas.getObjects()
//   request('screen-board-change', {
//     pathname: roomName,
//     boardPaths: objects.map((o: any) => ({ ...o.toJSON(), id: o.id })),
//   })
// }

export function clearScreenBoard() {
  // screenCanvas.clear()
  screenCanvas.remove(...screenCanvas.getObjects().slice(1))

  // saveScreenBoard()
}
