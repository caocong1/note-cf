import { Button, Input, InputRef, Modal, notification } from 'antd'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { myNameAtom, myPeerIdAtom, peersAtom } from '../../../atom'
import { useCallback, useEffect, useRef, useState } from 'react'
import request from '../../../request'
import { roomName, sendDataToPeers } from '../../../utils/peer'

const ChangeName: React.FC = () => {
  const [myName, setMyName] = useAtom(myNameAtom)
  const setPeers = useSetAtom(peersAtom)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const mustChangeName = myName === 'unknown'
  const myPeerId = useAtomValue(myPeerIdAtom)

  const doChangeName = useCallback(
    (name: string) => {
      setOpen(false)
      sendDataToPeers({
        type: 'change-name',
        data: {
          peerId: myPeerId,
          name,
        },
      })
      request('change-name', {
        pathname: roomName,
        peerId: myPeerId,
        name,
      })
      setMyName(name)
      setPeers((old) =>
        old.map((peer) => {
          if (peer.peerId === myPeerId) {
            peer.name = name
          }
          return peer
        }),
      )
    },
    [myPeerId, setMyName, setPeers],
  )
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
        {myName}
      </div>
      <Modal
        open={open || mustChangeName}
        onCancel={() => {
          setOpen(false)
        }}
        closable={!mustChangeName}
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
