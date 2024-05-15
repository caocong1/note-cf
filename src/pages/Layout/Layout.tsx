import React, { useLayoutEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { myPeerIdAtom, peersAtom } from '../../atom'
import { Badge, Dropdown, Radio, Spin, Tag } from 'antd'
import { initPeer, roomName } from '../../utils/peer'
import { PresetStatusColorType } from 'antd/es/_util/colors'
import ChangeName from './components/ChangeName'
import Note from '../Note'
import Screen from '../Screen'
import Board from '../Board'
import File from '../File'
import RemoteStreamBadge from '../Screen/components/RemoteStreamBadge'
import ScreenShareButton from '../Screen/components/ScreenShareButton'
import { pageLoadingAtom, componentAtom } from './atom'
import { showAlertAtom } from '../Screen/atom'

const badgeStatus: Record<string, PresetStatusColorType> = {
  connected: 'success',
  connectting: 'warning',
  self: 'default',
}

const Layout: React.FC = () => {
  const pageLoading = useAtomValue(pageLoadingAtom)
  const peers = useAtomValue(peersAtom)
  const [component, setComponent] = useAtom(componentAtom)
  const myPeerId = useAtomValue(myPeerIdAtom)
  const setShowAlert = useSetAtom(showAlertAtom)

  useLayoutEffect(() => {
    initPeer()
  }, [])

  return (
    <Spin spinning={pageLoading}>
      <div style={{ width: '100dvw', height: '100dvh' }}>
        <div style={{ display: component === 'note' ? 'block' : 'none' }}>
          <Note />
        </div>
        <div style={{ display: component === 'file' ? 'block' : 'none' }}>
          <File />
        </div>
        <div style={{ display: component === 'board' ? 'block' : 'none' }}>
          <Board />
        </div>
        <div style={{ display: component === 'screen' ? 'block' : 'none' }}>
          <Screen />
        </div>
        <div
          style={{
            width: '100dvw',
            height: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            boxSizing: 'border-box',
            borderTop: '1px solid #eee',
            position: 'fixed',
            bottom: 0,
            left: 0,
            background: '#fff',
          }}
        >
          <Dropdown
            menu={{
              items: peers
                .filter((peer) => peer.peerId !== myPeerId)
                .map((peer) => ({
                  key: peer.peerId,
                  label: (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      <Badge status={badgeStatus[peer.status]} />
                      <div>
                        {peer.name}
                        {peer.status === 'self' && '(me)'}
                      </div>
                    </div>
                  ),
                })),
            }}
            placement="topLeft"
            arrow
          >
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'baseline',
                cursor: 'pointer',
              }}
            >
              <ChangeName />
              <Badge count={peers.length} color="blue">
                <Tag color="purple">
                  {roomName === '/' ? '<public>' : roomName.slice(1)}
                </Tag>
              </Badge>
            </div>
          </Dropdown>
          <div>
            <Radio.Group
              size="small"
              value={component}
              onChange={(e) => {
                setComponent(e.target.value)
                if (e.target.value === 'board') {
                  setShowAlert(true)
                } else {
                  setShowAlert(false)
                }
              }}
            >
              <Radio.Button value="note">Note</Radio.Button>
              <Radio.Button value="file">File</Radio.Button>
              <Radio.Button value="board">Board</Radio.Button>
              <Radio.Button value="screen">
                <RemoteStreamBadge />
                Screen
                <ScreenShareButton />
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </div>
    </Spin>
  )
}

export default Layout
