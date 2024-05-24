import { myPeerIdAtom, peersAtom, store } from '@/atom'
import { filesAtom } from './atom'
import { notification } from 'antd'
import { DataConnection } from 'peerjs'
import { getNameFromId } from '@/utils/peer'

export function addFile(file: any) {
  store.set(filesAtom, (old) => [...old, file])
}

export function removeFile(id: any) {
  store.set(filesAtom, (old) => old.filter((f) => f.id !== id))
}

const chunkSize = 1024 * 1024 * 2
export async function requestDownload(data: any) {
  const { conn, fileId } = data
  const files = store.get(filesAtom)
  const fileData = files.find((f) => f.id === fileId)
  const peers = store.get(peersAtom)
  const p = peers.find((p) => p.peerId === conn.peer)
  if (!p || !fileData) {
    console.log('peer or file not found', p, fileData)
    return
  }
  if (fileData.type === 'file' && fileData.fileHandle) {
    notification.success({
      message: `< ${getNameFromId(p.peerId)} >开始下载文件[ ${fileData.name} ]`,
    })
    const file = await fileData.fileHandle.getFile()
    conn.send({
      type: 'send-file-start',
      data: { fileId, size: file.size },
    })
    const buffer = await file.arrayBuffer()
    const size = buffer.byteLength
    let start = 0
    let end = size > chunkSize ? chunkSize : size
    let sendBuffer = buffer.slice(start, end)
    while (sendBuffer.byteLength > 0) {
      conn.send({
        type: 'send-file',
        data: {
          fileId,
          buffer: sendBuffer,
          // start,
          end,
          // size,
        },
      })
      start = end
      end = size > start + chunkSize ? start + chunkSize : size
      sendBuffer = buffer.slice(start, end)
    }
  } else if (fileData.type === 'file' && fileData.file) {
    notification.success({
      message: `< ${getNameFromId(p.peerId)} >开始下载文件[ ${fileData.name} ]`,
    })
    const { file } = fileData
    conn.send({
      type: 'send-file-start',
      data: { fileId, size: file.size },
    })
    const buffer = await file.arrayBuffer()
    const size = buffer.byteLength
    let start = 0
    let end = size > chunkSize ? chunkSize : size
    let sendBuffer = buffer.slice(start, end)
    while (sendBuffer.byteLength > 0) {
      conn.send({
        type: 'send-file',
        data: {
          fileId,
          buffer: sendBuffer,
          // start,
          end,
          // size,
        },
      })
      start = end
      end = size > start + chunkSize ? start + chunkSize : size
      sendBuffer = buffer.slice(start, end)
    }
  } else if (
    fileData.type === 'directory' &&
    fileData.dirHandle &&
    fileData.subFiles?.length
  ) {
    notification.success({
      message: `< ${getNameFromId(p.peerId)} >开始下载文件夹[ ${fileData.name} ]`,
    })
    // const files = fileData.subFiles.map((fh: any) => ({
    //   name: fh.name,
    // }));
    for await (const subFile of fileData.subFiles) {
      const file = await subFile.fileHandle.getFile()
      // const relativePaths = await fileData.dirHandle.resolve(
      //   subFile.fileHandle,
      // );
      conn.send({
        type: 'send-file-start',
        data: {
          fileId,
          downloadingId: subFile.id,
          size: file.size,
        },
      })
      const buffer = await file.arrayBuffer()
      const size = buffer.byteLength
      let start = 0
      let end = size > chunkSize ? chunkSize : size
      let sendBuffer = buffer.slice(start, end)
      while (sendBuffer.byteLength > 0) {
        conn.send({
          type: 'send-file',
          data: {
            fileId,
            downloadingId: subFile.id,
            buffer: sendBuffer,
            end,
          },
        })
        start = end
        end = size > start + chunkSize ? start + chunkSize : size
        sendBuffer = buffer.slice(start, end)
      }
    }
  }
}

// export async function requestDownloadLegacy(data: any) {
//   const { conn, fileId } = data
//   const files = store.get(filesAtom)
//   const fileData = files.find((f) => f.id === fileId)
//   if (fileData.type === 'file' && fileData.file) {
//     const { file } = fileData
//     conn.send({
//       type: 'send-file-start',
//       data: { fileId, size: file.size },
//     })
//     const buffer = await file.arrayBuffer()
//     const size = buffer.byteLength
//     let start = 0
//     let end = size > chunkSize ? chunkSize : size
//     let sendBuffer = buffer.slice(start, end)
//     while (sendBuffer.byteLength > 0) {
//       conn.send({
//         type: 'send-file',
//         data: {
//           fileId,
//           buffer: sendBuffer,
//           // start,
//           end,
//           // size,
//         },
//       })
//       start = end
//       end = size > start + chunkSize ? start + chunkSize : size
//       sendBuffer = buffer.slice(start, end)
//     }
//   }
// }

export async function startReceiveFile(data: any) {
  const { fileId, size } = data
  const filesData = store.get(filesAtom)
  const fileData = filesData.find((f) => f.id === fileId)
  if (fileData?.type === 'file') {
    store.set(filesAtom, (o) =>
      o.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            downloading: {
              totalSize: size,
            },
          }
        }
        return f
      }),
    )
  } else if (fileData?.type === 'directory') {
    const { downloadingId } = data

    store.set(filesAtom, (o) =>
      o.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            downloading: true,
            subFiles: f.subFiles.map((f: any) => {
              if (f.id === downloadingId) {
                return { ...f, totalSize: size }
              }
              return f
            }),
          }
        }
        return f
      }),
    )
  }
}

export async function createFileWritable(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  relativePaths: string[],
) {
  let currentDirectory = directoryHandle
  for (const part of relativePaths) {
    currentDirectory = await currentDirectory.getDirectoryHandle(part, {
      create: true,
    })
  }

  const fileHandle = await currentDirectory.getFileHandle(fileName, {
    create: true,
  })

  const writable = await fileHandle.createWritable()

  return writable
}

export function downloadFile(data: any, conn: DataConnection) {
  const { fileId, buffer, end } = data
  const files = store.get(filesAtom)
  const fileData = files.find((f) => f.id === fileId)
  if (fileData?.type === 'file' && fileData.writable) {
    fileData.writable.write(buffer).then(() => {
      if (fileData.downloading.totalSize === end) {
        fileData.writable.close()
        notification.success({
          message: `文件[ ${fileData.name} ]下载完成`,
        })
        const myPeerId = store.get(myPeerIdAtom)
        conn.send({
          type: 'download-complete',
          data: { fileId, peerId: myPeerId },
        })
      }
      store.set(filesAtom, (o) =>
        o.map((f) => {
          if (f.id === fileId) {
            return {
              ...f,
              downloading: {
                ...f.downloading,
                end,
              },
            }
          }
        }),
      )
    })
  } else if (fileData?.type === 'file') {
    const fileBuffer = new Uint8Array([
      ...(fileData.fileBuffer ?? []),
      ...buffer,
    ])
    if (fileData.downloading.totalSize === end) {
      const file = new Blob([fileBuffer], { type: fileData.contentType })
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = fileData.name
      a.target = '_blank'
      a.click()
      URL.revokeObjectURL(url)
      notification.success({
        message: `文件[ ${fileData.name} ]下载完成`,
      })
      const myPeerId = store.get(myPeerIdAtom)
      conn.send({
        type: 'download-complete',
        data: { fileId, peerId: myPeerId },
      })
    }
    store.set(filesAtom, (o) =>
      o.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            fileBuffer,
            downloading: {
              ...f.downloading,
              end,
            },
          }
        }
      }),
    )
  } else if (fileData?.type === 'directory') {
    const { downloadingId } = data
    const subFile = fileData.subFiles.find((f: any) => f.id === downloadingId)
    if (subFile) {
      subFile.writable.write(buffer).then(() => {
        if (subFile.totalSize === end) {
          subFile.writable.close()
          notification.success({
            message: `文件[ ${subFile.name} ]下载完成`,
          })
          const sf = fileData.subFiles.some(
            (f: any) => f.id !== downloadingId && f.totalSize !== f.end,
          )
          if (!sf) {
            notification.success({
              message: `文件夹[ ${fileData.name} ]下载完成`,
            })
            const myPeerId = store.get(myPeerIdAtom)
            conn.send({
              type: 'download-complete',
              data: { fileId, peerId: myPeerId },
            })
          }
        }
        store.set(filesAtom, (o) =>
          o.map((f) => {
            if (f.id === fileId) {
              return {
                ...f,
                subFiles: f.subFiles.map((sf: any) => {
                  if (sf.id === downloadingId) {
                    return { ...sf, end }
                  }
                  return sf
                }),
              }
            }
          }),
        )
      })
    }
  } else {
    conn.send({
      type: 'send-file-error',
      data: fileId,
    })
  }
}

export async function getFilesRecursively(directoryHandle: any) {
  const files = []
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file') {
      files.push(entry)
    } else if (entry.kind === 'directory') {
      const subFiles: any = await getFilesRecursively(entry)
      files.push(...subFiles)
    }
  }
  return files
}
