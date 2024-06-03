import { sendDataToPeers } from '@/utils/peer'
import { Canvas, PencilBrush, Point, util } from 'fabric'

export let canvas: Canvas
export let pencilBrush: PencilBrush
export const setCanvas = (value: Canvas) => {
  canvas = value
}

export function jsonAddToBoard(json: any) {
  util.enlivenObjects(json).then((objects) => {
    objects.forEach(function (o: any) {
      canvas.add(o)
    })
  })
}

export function removeBoardObject(data: any) {
  const removeObject = canvas.getObjects().find((o: any) => o.id === data)
  removeObject && canvas.remove(removeObject)
}

export function getBoardObjectsJson() {
  return canvas?.getObjects()?.map((o: any) => ({ ...o.toJSON(), id: o.id }))
}

// export function saveBoard() {
//   const objects = canvas.getObjects()
//   request('board-change', {
//     pathname: roomName,
//     boardPaths: objects.map((o: any) => ({ ...o.toJSON(), id: o.id })),
//   })
// }
export function initBoardCanvas(canvasEl: HTMLCanvasElement) {
  canvas = new Canvas(canvasEl, {
    isDrawingMode: true,
    stopContextMenu: true,
    fireMiddleClick: true,
    fireRightClick: true,
  })
  pencilBrush = new PencilBrush(canvas)
  pencilBrush.color = 'red'
  pencilBrush.width = 10
  canvas.freeDrawingBrush = pencilBrush

  canvas.on('path:created', function (e: any) {
    // console.log("path:created", e);
    const newPath = e.path
    const id = crypto.randomUUID()
    e.path.set({ id })

    const json = newPath.toJSON()
    sendDataToPeers({ type: 'board-object-add', data: { ...json, id } })
    // saveBoard()
  })
  canvas.on('mouse:wheel', (opt) => {
    opt.e.preventDefault()
    opt.e.stopPropagation()

    if (opt.e.ctrlKey) {
      console.log('pinch')
      const delta = opt.e.deltaY
      let zoom = canvas.getZoom()
      zoom *= 0.999 ** delta
      canvas.setZoom(zoom)
    } else {
      // const e = opt.e
      // const vpt = canvas.viewportTransform
      // vpt[4] += e.deltaX
      // vpt[5] += e.deltaY
      // canvas.requestRenderAll()
      const delta = opt.e.deltaY // 滚轮，向上滚一下是 -100，向下滚一下是 100
      let zoom = canvas.getZoom() // 获取画布当前缩放值
      zoom *= 0.996 ** delta
      if (zoom > 20) zoom = 20 // 限制最大缩放级别
      if (zoom < 0.01) zoom = 0.01 // 限制最小缩放级别

      // 以鼠标所在位置为原点缩放
      const point = new Point(opt.e.offsetX, opt.e.offsetY)
      canvas.zoomToPoint(
        point,
        zoom, // 传入修改后的缩放级别
      )
    }
  })
  // canvas拖拽
  let mouseDownButton: number | null = null
  canvas.on('mouse:up', () => {
    // console.log("mouse:up", e);
    mouseDownButton = null
  })
  canvas.on('mouse:down', (e: any) => {
    // console.log('mouse:down', e.e.button)
    // if (e.e.button === 1) {
    //   isMiddleMouseDown = true
    // }
    mouseDownButton = e.e.button
    if (e.e.button === 2 && e.target) {
      // console.log(e.target, canvas.getObjects());
      canvas.remove(e.target)
      sendDataToPeers({ type: 'board-object-remove', data: e.target.id })
      // saveBoard()
    }
  })
  canvas.on('mouse:move', (e) => {
    // console.log("mouse:move", e);
    const event: any = e?.e
    if (mouseDownButton && event) {
      const point = new Point(event.movementX, event.movementY)
      canvas.relativePan(point)
    }
  })
}

export function clearBoard() {
  canvas.clear()
  // saveBoard()
}
