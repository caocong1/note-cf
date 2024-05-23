import { Button, Input, InputRef, Modal } from 'antd'
import { useAtomValue, useSetAtom } from 'jotai'
import { myPeerIdAtom } from '../../../atom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { initPeer } from '../../../utils/peer'
import { notification } from '../Layout'
import { pageLoadingAtom } from '../atom'

const ChangeName: React.FC = () => {
  const myPeerId = useAtomValue(myPeerIdAtom)
  const setPageLoading = useSetAtom(pageLoadingAtom)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const mustChangeName = myPeerId === ''
  if (mustChangeName) {
    document.body.style.pointerEvents = 'none'
  } else {
    document.body.style.pointerEvents = 'auto'
  }

  const doChangeName = useCallback((name: string) => {
    setOpen(false)
    setPageLoading(true)
    initPeer(name)
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
      <div
        style={{ cursor: 'pointer', color: '#1565c0' }}
        onClick={() => {
          setOpen(true)
        }}
      >
        {myPeerId}
      </div>
      <Modal
        open={open || mustChangeName}
        onCancel={() => {
          setOpen(false)
        }}
        closable={!mustChangeName}
        // mask={true}
        // maskClosable={false}
        title={mustChangeName ? '设置昵称' : '修改昵称'}
        footer={
          <Button
            onClick={() => {
              if (value === '') {
                notification.error({ message: '昵称不能为空' })
                return
              }
              doChangeName(value)
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
              doChangeName(e.target.value)
            }
          }}
        />
      </Modal>
    </>
  )
}
export default ChangeName
