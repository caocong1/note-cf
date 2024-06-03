import { Button, Input, InputRef, Modal } from 'antd'
import { useAtomValue, useSetAtom } from 'jotai'
import { myPeerIdAtom } from '../../../atom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getIdFromName, getNameFromId, initPeer } from '../../../utils/peer'
import { notification } from '../Layout'
import { pageLoadingAtom } from '../atom'

const ChangeName: React.FC = () => {
  const myPeerId = useAtomValue(myPeerIdAtom)
  const setPageLoading = useSetAtom(pageLoadingAtom)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const mustChangeName = myPeerId === ''

  useEffect(() => {
    document.body.style.pointerEvents = myPeerId === '' ? 'none' : 'auto'
  }, [myPeerId])

  const doChangeName = useCallback((name: string) => {
    const id = getIdFromName(name.trim())
    if (id) {
      setOpen(false)
      setPageLoading(true)
      initPeer(id)
    } else {
      notification.error({ message: '昵称不能为空' })
    }
  }, [])
  const inputRef = useRef<InputRef>(null)
  useEffect(() => {
    if (open) {
      setValue(getNameFromId(myPeerId))
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
        {getNameFromId(myPeerId)}
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
