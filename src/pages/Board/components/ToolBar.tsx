import { sendDataToPeers } from '@/utils/peer'
import Icon, { ClearOutlined } from '@ant-design/icons'
import { Button, ColorPicker, GetProp, Popover, Slider } from 'antd'
import PenSvg from '@/assets/pen.svg?react'
import { canvas, pencilBrush } from '../util'
import { useState } from 'react'
import { ColorPickerProps } from 'antd/es/color-picker'

const ToolBar: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <Popover placement="left" title="Pen" content={<PenSetting />}>
        <Button icon={<Icon component={PenSvg} />} />
      </Popover>
      <Button
        danger
        type={'dashed'}
        icon={<ClearOutlined />}
        onClick={() => {
          canvas.clear()
          sendDataToPeers({ type: 'board-clear', data: {} })
        }}
      />
    </div>
  )
}

export default ToolBar

type Color = GetProp<ColorPickerProps, 'value'>

const PenSetting: React.FC = () => {
  const [color, setColor] = useState<Color>('red')
  const [inputValue, setInputValue] = useState<number>(10)

  return (
    <div>
      <div style={{ height: inputValue }} />
      <ColorPicker
        value={color}
        onChange={(res) => {
          pencilBrush.color = res.toHexString()
          setColor(res)
        }}
      />
      <Slider
        min={1}
        max={50}
        onChange={(v) => {
          pencilBrush.width = v
          setInputValue(v)
        }}
        value={inputValue}
      />
    </div>
  )
}
