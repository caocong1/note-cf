import { myPeerIdAtom, store } from '@/atom'
import { FabricImage, Canvas } from 'fabric'
import { StreamData, remoteStreamDataAtom, streamingDataAtom } from './atom'

let video: HTMLVideoElement
export let canvasVideo: FabricImage
export let screenCanvas: Canvas

export const initScreenCanvas = () => {
  const canvasEl = document.getElementById('screen-canvas') as HTMLCanvasElement
  canvasEl.width = window.innerWidth
  canvasEl.height = window.innerHeight - 50
  screenCanvas = new Canvas(canvasEl)
}

export const resetVideo = () => {
  video = document.createElement('video')
  video.width = window.outerWidth * window.devicePixelRatio
  video.height = window.outerHeight * window.devicePixelRatio
  canvasVideo = new FabricImage(video, {
    left: 0,
    top: 0,
    width: video.width,
    height: video.height,
    selectable: false,
  })
  screenCanvas.remove(...screenCanvas.getObjects())
  screenCanvas.add(canvasVideo)
  store.set(streamingDataAtom, {
    id: '',
    stream: null,
  })
}

export function playVideo(data: StreamData) {
  video.srcObject = data.stream
  video.play()
  store.set(streamingDataAtom, data)
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
