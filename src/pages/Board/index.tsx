import React, { useEffect, useRef } from 'react'
import ToolBar from './components/ToolBar'
import { initBoardCanvas, canvas, pencilBrush } from './util'
import { sendDataToPeers } from '@/utils/peer'
import BoardHelpAlert from '../Screen/components/BorderHelpAlert'
import { showAlertAtom } from '../Screen/atom'
import { useAtomValue } from 'jotai'

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const showAlert = useAtomValue(showAlertAtom)

  useEffect(() => {
    if (!canvasRef.current) return
    canvasRef.current!.width = window.innerWidth
    canvasRef.current!.height = window.innerHeight - 50

    initBoardCanvas(canvasRef.current!)

    function resizeCanvas() {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight - 50

      canvasRef.current!.width = newWidth
      canvasRef.current!.height = newHeight
      canvasRef.current!.style.width = newWidth + 'px'
      canvasRef.current!.style.height = newHeight + 'px'

      // 重置fabric画布的大小
      canvas.width = newWidth
      canvas.height = newHeight
      canvas.calcOffset()
      canvas.renderAll()
    }

    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.dispose()
    }
  }, [])

  return (
    <div
      style={{
        width: '100dvw',
        height: 'calc(100dvh - 50px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100dvw', height: 'calc(100dvh - 50px)' }}
      />
      <ToolBar
        canvasClear={() => {
          canvas.clear()
          sendDataToPeers({ type: 'board-clear', data: {} })
        }}
        onPencilColorChange={(c) => {
          pencilBrush.color = c
        }}
        onPencilWidthChange={(w) => {
          pencilBrush.width = w
        }}
      />
      {!localStorage.notShowAlert && showAlert && <BoardHelpAlert />}
    </div>
  )
}

export default Board
