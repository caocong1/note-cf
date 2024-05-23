import { sendDataToPeers } from '../../utils/peer'

const Note: React.FC = () => {
  return (
    <div
      id="content"
      contentEditable
      style={{
        width: '100dvw',
        height: 'calc(100dvh - 50px)',
        boxSizing: 'border-box',
        padding: 8,
        overflow: 'auto',
      }}
      onInput={(e: any) => {
        sendDataToPeers({ type: 'note-change', data: e.target.innerHTML })
        // request('note-change', {
        //   pathname: roomName,
        //   data: e.target.innerHTML,
        // })
      }}
    />
  )
}

export default Note
