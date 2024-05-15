import { Alert, Button } from 'antd'
import { useSetAtom } from 'jotai'
import { showAlertAtom } from '../atom'

const BoardHelpAlert = () => {
  const setShowAlert = useSetAtom(showAlertAtom)

  return (
    <Alert
      message={
        <div style={{ margin: '0 8px' }}>
          左键画图，右键删除，滚轮缩放，中键和右键拖拽
        </div>
      }
      type="success"
      action={
        <Button
          size="small"
          onClick={() => {
            setShowAlert(false)
            localStorage.notShowAlert = '1'
          }}
        >
          不再显示
        </Button>
      }
      closable
      style={{ position: 'absolute', top: 16, right: 16 }}
    />
  )
}

export default BoardHelpAlert
