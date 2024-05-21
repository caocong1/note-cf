import Icon, { ClearOutlined } from '@ant-design/icons'
import { Button, ColorPicker, Popover, Slider } from 'antd'
import PenSvg from '@/assets/pen.svg?react'
import React, { useState } from 'react'
import { PencilBrush } from 'fabric'

const ToolBar: React.FC<{
  canvasClear: () => void
  pencilBrush: PencilBrush
}> = ({ canvasClear, pencilBrush }) => {
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
      <Popover
        placement="left"
        title="Pen"
        content={<PenSetting pencilBrush={pencilBrush} />}
      >
        <Button icon={<Icon component={PenSvg} />} />
      </Popover>
      <Button
        danger
        type={'dashed'}
        icon={<ClearOutlined />}
        onClick={canvasClear}
      />
    </div>
  )
}

export default ToolBar

// type Color = GetProp<ColorPickerProps, 'value'>

const PenSetting: React.FC<{ pencilBrush: PencilBrush }> = ({
  pencilBrush,
}) => {
  const [color, setColor] = useState<string>('red')
  const [inputValue, setInputValue] = useState<number>(10)

  return (
    <div>
      <div
        style={{
          height: inputValue,
          // width: '100%',
          backgroundColor: color,
          marginBottom: 8,
          borderRadius: inputValue / 2,
        }}
      />
      <ColorPicker
        value={color}
        onChange={(res) => {
          pencilBrush.color = res.toHexString()
          setColor(res.toHexString())
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
