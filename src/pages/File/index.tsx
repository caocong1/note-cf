import { Button, Progress, Table, Upload, notification } from 'antd'
import { useAtom, useAtomValue } from 'jotai'
import { myNameAtom, myPeerIdAtom, peersAtom } from '@/atom'
import { sendDataToPeers } from '@/utils/peer'
import { filesAtom } from './atom'
import { getFilesRecursively, createFileWritable } from './util'

const File: React.FC = () => {
  const [files, setFiles] = useAtom(filesAtom)
  const myName = useAtomValue(myNameAtom)
  const peers = useAtomValue(peersAtom)
  const myPeerId = useAtomValue(myPeerIdAtom)

  return (
    <div
      style={{
        width: '100dvw',
        height: 'calc(100dvh - 50px)',
        boxSizing: 'border-box',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          padding: 8,
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          type="primary"
          onClick={async () => {
            const [fileHandle] = await (window as any).showOpenFilePicker()
            const file = {
              id: crypto.randomUUID(),
              name: fileHandle.name,
              type: fileHandle.kind,
              fileHandle,
              user: myName,
              peerId: myPeerId,
            }
            setFiles((o) => [...o, file])
            sendDataToPeers({
              type: 'file-add',
              data: { ...file, fileHandle: undefined },
            })
          }}
        >
          文件
        </Button>
        <Upload
          customRequest={({ file, filename }: any) => {
            const fileData = {
              id: crypto.randomUUID(),
              name: filename,
              type: 'file',
              file,
              contentType: file.type,
              user: myName,
              peerId: myPeerId,
            }
            setFiles((o) => [...o, fileData])
            sendDataToPeers({
              type: 'file-add',
              data: { ...fileData, file: undefined },
            })
          }}
          showUploadList={false}
        >
          <Button type="primary">文件o</Button>
        </Upload>
        <Button
          type="primary"
          onClick={async () => {
            const dirHandle = await (window as any).showDirectoryPicker()
            const fileHandles = await getFilesRecursively(dirHandle)
            if (fileHandles.length) {
              const subFiles = []
              for await (const fileHandle of fileHandles) {
                const relativePaths = await dirHandle.resolve(fileHandle)
                subFiles.push({
                  id: crypto.randomUUID(),
                  name: fileHandle.name,
                  fileHandle,
                  relativePaths: relativePaths.slice(0, -1),
                })
              }
              const file = {
                id: crypto.randomUUID(),
                name: dirHandle.name,
                type: dirHandle.kind,
                dirHandle,
                subFiles,
                user: myName,
                peerId: myPeerId,
              }
              setFiles((o) => [...o, file])
              sendDataToPeers({
                type: 'file-add',
                data: {
                  ...file,
                  dirHandle: undefined,
                  subFiles: file.subFiles.map((f) => ({
                    ...f,
                    fileHandle: undefined,
                  })),
                },
              })
            } else {
              notification.error({ message: '该文件夹下没有文件' })
            }
          }}
        >
          文件夹
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
          },
          {
            title: 'Type',
            dataIndex: 'type',
          },
          //   {
          //     title: "Size",
          //     dataIndex: "size",
          //   },
          {
            title: 'User',
            dataIndex: 'user',
          },
          {
            title: 'Operate',
            render: (record) => (
              <div>
                {record.peerId === myPeerId && (
                  <Button
                    danger
                    type="link"
                    onClick={async () => {
                      setFiles((o) => o.filter((i) => i.id !== record.id))
                      sendDataToPeers({
                        type: 'file-remove',
                        data: record.id,
                      })
                    }}
                  >
                    移除
                  </Button>
                )}
                {record.peerId !== myPeerId &&
                  !record.downloading &&
                  record.type === 'file' && (
                    <Button
                      type="link"
                      onClick={async () => {
                        const peer = peers.find(
                          (p) => p.peerId === record.peerId,
                        )
                        if (peer) {
                          if ((window as any).showSaveFilePicker) {
                            const fileHandle = await (
                              window as any
                            ).showSaveFilePicker({ suggestedName: record.name })
                            const writable = await fileHandle.createWritable()
                            setFiles((o) =>
                              o.map((f) => {
                                if (f.id === record.id) {
                                  return { ...f, writable }
                                }
                                return f
                              }),
                            )
                            peer.conn?.send({
                              type: 'request-download',
                              data: record.id,
                            })
                          } else {
                            peer.conn?.send({
                              type: 'request-download-legacy',
                              data: record.id,
                            })
                          }
                        } else {
                          notification.error({
                            message: '该文件发送人已离线',
                          })
                          sendDataToPeers({
                            type: 'file-remove',
                            data: record.id,
                          })
                        }
                      }}
                    >
                      下载
                    </Button>
                  )}
                {/* {record.peerId !== myPeerId &&
                  !record.downloading &&
                  record.type === 'directory' && (
                    <Button
                      type="link"
                      onClick={async () => {
                        const peer = peers.find(
                          (p) => p.peerId === record.peerId,
                        )
                        if (peer) {
                          const dirHandle = await (
                            window as any
                          ).showDirectoryPicker()
                          for await (const subFile of record.subFiles) {
                            const writable = await createFileWritable(
                              dirHandle,
                              subFile.name,
                              subFile.relativePaths,
                            )
                            subFile.writable = writable
                          }
                          setFiles((o) =>
                            o.map((f) => {
                              if (f.id === record.id) {
                                return {
                                  ...f,
                                  dirHandle,
                                  subFiles: record.subFiles,
                                }
                              }
                              return f
                            }),
                          )
                          peer.conn?.send({
                            type: 'request-download',
                            data: record.id,
                          })
                        } else {
                          notification.error({ message: '该文件发送人已离线' })
                          sendDataToPeers({
                            type: 'file-remove',
                            data: record.id,
                          })
                        }
                      }}
                    >
                      下载
                    </Button>
                  )} */}
                {record.downloading && record.type === 'file' && (
                  <Progress
                    percent={Math.floor(
                      ((record.downloading.end || 0) * 100) /
                        record.downloading.totalSize,
                    )}
                    status={
                      record.downloading.end === record.downloading.totalSize
                        ? 'success'
                        : 'active'
                    }
                  />
                )}
                {record.downloading && record.type === 'directory' && (
                  <div>
                    {record.subFiles.map((subFile: any) => (
                      <div key={subFile.id}>
                        <div>
                          {subFile.relativePaths.length
                            ? '/' + subFile.relativePaths.join('/')
                            : ''}
                          /{subFile.name}
                        </div>
                        <Progress
                          percent={Math.floor(
                            ((subFile.end || 0) * 100) / subFile.totalSize,
                          )}
                          status={
                            subFile.end === subFile.totalSize
                              ? 'success'
                              : 'active'
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
        dataSource={files}
      />
    </div>
  )
}

export default File
