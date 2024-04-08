import { Badge } from 'antd'
import { useAtomValue } from 'jotai'
import { remoteStreamDataAtom } from '../atom'

const RemoteStreamBadge: React.FC = () => {
  const remoteStreamData = useAtomValue(remoteStreamDataAtom)
  return (
    <Badge
      status={remoteStreamData.length ? 'processing' : 'default'}
      style={{ paddingRight: 8 }}
    />
  )
}

export default RemoteStreamBadge
