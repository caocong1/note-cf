import { Button, Input, InputRef, Modal } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { connectToPeer, getIdFromName } from '../../../utils/peer'
import { notification } from '../Layout'

const ConnectPeer: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const doConnect = useCallback((name: string) => {
    setOpen(false)
    connectToPeer(getIdFromName(name))
  }, [])
  const inputRef = useRef<InputRef>(null)
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setValue('')
    }
  }, [open])

  return (
    <>
      <Button
        size="small"
        onClick={() => {
          setOpen(true)
        }}
      >
        连接
      </Button>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false)
        }}
        title={'连接用户'}
        footer={
          <Button
            onClick={() => {
              if (value === '') {
                notification.error({ message: '昵称不能为空' })
                return
              }
              doConnect(value)
            }}
          >
            确定
          </Button>
        }
      >
        <Input
          ref={inputRef}
          placeholder="请输入昵称"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && e.target.value !== '') {
              doConnect(e.target.value)
            }
          }}
        />
      </Modal>
    </>
  )
}

export default ConnectPeer
