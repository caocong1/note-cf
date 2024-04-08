import React, { useEffect, useRef } from 'react'
import ToolBar from './components/ToolBar'
import { initBoardCanvas, canvas } from './util'

const Board: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    canvasRef.current!.width = window.innerWidth
    canvasRef.current!.height = window.innerHeight - 50

    initBoardCanvas(canvasRef)

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
      <ToolBar />
    </div>
  )
}

export default Board
