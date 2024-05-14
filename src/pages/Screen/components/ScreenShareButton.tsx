import { sendDataToPeers, callToPeers } from '@/utils/peer'
import Icon from '@ant-design/icons'
import { useAtomValue } from 'jotai'
import { streamingDataAtom } from '../atom'
import StopSvg from '@/assets/stop.svg?react'
import PlaySvg from '@/assets/play.svg?react'
import { myPeerIdAtom } from '@/atom'
import { playVideo, resetVideo } from '../util'
import { notification } from 'antd'

const ScreenShareButton: React.FC = () => {
  const streamingData = useAtomValue(streamingDataAtom)
  const myPeerId = useAtomValue(myPeerIdAtom)

  if (streamingData.id) {
    return (
      <Icon
        component={StopSvg}
        style={{ color: 'red', marginLeft: 8 }}
        onClick={() => {
          if (streamingData.id === myPeerId) {
            sendDataToPeers({
              type: 'screen-stop',
              data: { peerId: myPeerId },
            })
          }
          resetVideo()
        }}
      />
    )
  } else {
    return (
      <Icon
        component={PlaySvg}
        style={{ color: 'green', marginLeft: 8 }}
        onClick={() => {
          navigator.mediaDevices
            .getDisplayMedia({
              video: true,
              audio: false,
            })
            .then(function (stream) {
              callToPeers(stream)
              playVideo({
                id: myPeerId,
                stream,
              })
            })
            .catch((e) => {
              console.log('getDisplayMedia error', e)
              if (e.message.includes('Permission denied')) {
                notification.error({
                  message: '错误',
                  description: 'Permission denied，可能是浏览器不支持',
                })
              }
              resetVideo()
              sendDataToPeers({
                type: 'screen-stop',
                data: { peerId: myPeerId },
              })
            })
        }}
      />
    )
  }
}

export default ScreenShareButton
