import React, { useLayoutEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  componentAtom,
  pageLoadingAtom,
  peersAtom,
  remoteStreamDataAtom,
  streamingDataAtom,
} from "./atom";
import { Badge, Dropdown, Radio, Spin, Tag } from "antd";
import {
  callToPeers,
  initPeer,
  myPeerId,
  resetVideo,
  roomName,
  sendDataToPeers,
  video,
} from "./peer";
import { PresetStatusColorType } from "antd/es/_util/colors";
import ChangeName from "./component/ChangeName";
import Note from "./Note";
import Screen from "./Screen";
import Board from "./Board";
import File from "./File";
import StopSvg from "./assets/stop.svg?react";
import PlaySvg from "./assets/play.svg?react";
import Icon from "@ant-design/icons";

const badgeStatus: Record<string, PresetStatusColorType> = {
  connected: "success",
  connectting: "warning",
  self: "default",
};

const Layout: React.FC = () => {
  const pageLoading = useAtomValue(pageLoadingAtom);
  const peers = useAtomValue(peersAtom);
  const [component, setComponent] = useAtom(componentAtom);

  useLayoutEffect(() => {
    initPeer();
  }, []);

  return (
    <Spin spinning={pageLoading}>
      <div style={{ width: "100vw", height: "100vh" }}>
        <div style={{ display: component === "note" ? "block" : "none" }}>
          <Note />
        </div>
        <div style={{ display: component === "file" ? "block" : "none" }}>
          <File />
        </div>
        <div style={{ display: component === "board" ? "block" : "none" }}>
          <Board />
        </div>
        <div style={{ display: component === "screen" ? "block" : "none" }}>
          <Screen />
        </div>
        <div
          style={{
            width: "100vw",
            height: 50,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
            boxSizing: "border-box",
            borderTop: "1px solid #eee",
            position: "fixed",
            bottom: 0,
            left: 0,
            background: "#fff",
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
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <Badge status={badgeStatus[peer.status]} />
                      <div>
                        {peer.name}
                        {peer.status === "self" && "(me)"}
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
                display: "flex",
                gap: 16,
                alignItems: "baseline",
                cursor: "pointer",
              }}
            >
              <ChangeName />
              <Badge count={peers.length} color="blue">
                <Tag color="purple">
                  {roomName === "/" ? "<public>" : roomName.slice(1)}
                </Tag>
              </Badge>
            </div>
          </Dropdown>
          <div>
            <Radio.Group
              value={component}
              onChange={(e) => setComponent(e.target.value)}
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
  );
};

export default Layout;

const RemoteStreamBadge: React.FC = () => {
  const remoteStreamData = useAtomValue(remoteStreamDataAtom);
  return (
    <Badge
      status={remoteStreamData.length ? "processing" : "default"}
      style={{ paddingRight: 8 }}
    />
  );
};

const ScreenShareButton: React.FC = () => {
  const [streamingData, setStreamingData] = useAtom(streamingDataAtom);

  if (streamingData.id) {
    return (
      <Icon
        component={StopSvg}
        style={{ color: "red", marginLeft: 8 }}
        onClick={() => {
          if (streamingData.id === myPeerId) {
            sendDataToPeers({
              type: "screen-stop",
              data: { peerId: myPeerId },
            });
          }
          resetVideo();
        }}
      />
    );
  } else {
    return (
      <Icon
        component={PlaySvg}
        style={{ color: "green", marginLeft: 8 }}
        onClick={() => {
          navigator.mediaDevices
            .getDisplayMedia({
              video: true,
              audio: false,
            })
            .then(function (stream) {
              callToPeers(stream);
              video.srcObject = stream;
              video.play();
              setStreamingData({
                id: myPeerId,
                stream,
              });
            })
            .catch((e) => {
              console.log("getDisplayMedia error", e);
              resetVideo();
              sendDataToPeers({
                type: "screen-stop",
                data: { peerId: myPeerId },
              });
            });
        }}
      />
    );
  }
};
