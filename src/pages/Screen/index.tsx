import { Button } from 'antd'
import { useAtomValue } from 'jotai'
import { PlayCircleTwoTone, RedoOutlined } from '@ant-design/icons'
import { streamingDataAtom, remoteStreamDataAtom, showAlertAtom } from './atom'
import { playVideo, restoreSize, screenCanvas, screenPencilBrush } from './util'
import ToolBar from '../Board/components/ToolBar'
import { sendDataToPeers } from '@/utils/peer'
import BoardHelpAlert from './components/BorderHelpAlert'

const Screen: React.FC = () => {
  const streamingData = useAtomValue(streamingDataAtom)
  const remoteStreamData = useAtomValue(remoteStreamDataAtom)
  const showAlert = useAtomValue(showAlertAtom)
  // const [isPenMode, setIsPenMode] = useAtom(isPenModeAtom)

  // useEffect(() => {
  //   initScreenCanvas()
  //   resetVideo()

  //   screenCanvas.on('mouse:wheel', (opt) => {
  //     const delta = opt.e.deltaY // 滚轮，向上滚一下是 -100，向下滚一下是 100
  //     let zoom = screenCanvas.getZoom() // 获取画布当前缩放值
  //     zoom *= 0.999 ** delta
  //     if (zoom > 20) zoom = 20 // 限制最大缩放级别
  //     if (zoom < 0.01) zoom = 0.01 // 限制最小缩放级别

  //     // 以鼠标所在位置为原点缩放
  //     const point = new Point(opt.e.offsetX, opt.e.offsetY)
  //     console.log('zoom', zoom)
  //     screenCanvas.zoomToPoint(
  //       point,
  //       zoom, // 传入修改后的缩放级别
  //     )
  //   })
  //   let mouseDown = false
  //   screenCanvas.on('mouse:up', () => {
  //     // console.log("mouse:up", e);
  //     mouseDown = false
  //   })
  //   screenCanvas.on('mouse:down', () => {
  //     // console.log("mouse:down", e);
  //     mouseDown = true
  //   })
  //   screenCanvas.on('mouse:move', (e) => {
  //     // console.log("mouse:move", e);
  //     const event: any = e?.e
  //     if (mouseDown && event) {
  //       const point = new Point(event.movementX, event.movementY)
  //       screenCanvas.relativePan(point)
  //     }
  //   })

  //   function resizeCanvas() {
  //     const newWidth = window.innerWidth
  //     const newHeight = window.innerHeight - 50

  //     const canvasEl = document.getElementById(
  //       'screen-canvas',
  //     ) as HTMLCanvasElement
  //     canvasEl.width = newWidth
  //     canvasEl.height = newHeight
  //     canvasEl.style.width = newWidth + 'px'
  //     canvasEl.style.height = newHeight + 'px'

  //     // 重置fabric画布的大小
  //     screenCanvas.width = newWidth
  //     screenCanvas.height = newHeight
  //     screenCanvas.calcOffset()
  //     screenCanvas.renderAll()
  //   }

  //   window.addEventListener('resize', resizeCanvas)

  //   util.requestAnimFrame(function render() {
  //     screenCanvas.renderAll()
  //     util.requestAnimFrame(render)
  //   })

  //   return () => {
  //     window.removeEventListener('resize', resizeCanvas)
  //     screenCanvas.dispose()
  //   }
  // }, [])

  return (
    <div
      style={{
        width: '100dvw',
        height: 'calc(100dvh - 50px)',
        boxSizing: 'border-box',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <canvas id="screen-canvas" />
      {streamingData.id && (
        <ToolBar
          canvasClear={() => {
            // screenCanvas.clear()
            // console.log(screenCanvas.getObjects())
            screenCanvas.remove(...screenCanvas.getObjects().slice(1))
            sendDataToPeers({ type: 'screen-board-clear', data: {} })
          }}
          pencilBrush={screenPencilBrush}
        />
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {streamingData.id ? (
          <Button
            icon={<RedoOutlined />}
            onClick={() => {
              restoreSize()
            }}
          />
        ) : (
          remoteStreamData.map((v) => (
            <Button
              key={v.id}
              icon={<PlayCircleTwoTone />}
              onClick={() => {
                playVideo(v)
              }}
            >
              {v.name}
            </Button>
          ))
        )}
      </div>
      {showAlert && <BoardHelpAlert />}
    </div>
  )
}

export default Screen
