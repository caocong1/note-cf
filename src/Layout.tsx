import React, { useLayoutEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { myPeerIdAtom, pageLoadingAtom, peersAtom } from "./atom";
import { Badge, Dropdown, Radio, Spin } from "antd";
import { initPeer } from "./peer";
import { PresetStatusColorType } from "antd/es/_util/colors";
import ChangeName from "./component/ChangeName";
import Note from "./Note";
import Pad from "./Pad";
import Screen from "./Screen";

const pathname = location.pathname;

const badgeStatus: Record<string, PresetStatusColorType> = {
  connected: "success",
  init: "warning",
  self: "default",
};

const Layout: React.FC = () => {
  // console.log("Layout");
  const pageLoading = useAtomValue(pageLoadingAtom);
  const myPeerId = useAtomValue(myPeerIdAtom);
  const [component, setComponent] = useState("note");
  const peers = useAtomValue(peersAtom);
  // console.log("peers", peers);

  useLayoutEffect(() => {
    initPeer();
  }, []);

  return (
    <Spin spinning={pageLoading}>
      <div style={{ width: "100vw", height: "100vh" }}>
        <div style={{ display: component === "note" ? "block" : "none" }}>
          <Note />
        </div>
        <div style={{ display: component === "pad" ? "block" : "none" }}>
          <Pad />
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
          }}
        >
          <div style={{ display: "flex" }}>
            <ChangeName />
            {/* <div style={{ cursor: "pointer" }} onClick={() => {}}>
              {myName}
            </div> */}
            ({myPeerId})
          </div>
          <div>
            <Radio.Group
              value={component}
              onChange={(e) => setComponent(e.target.value)}
            >
              <Radio.Button value="note">Note</Radio.Button>
              <Radio.Button value="pad">Pad</Radio.Button>
              <Radio.Button value="screen">Screen</Radio.Button>
            </Radio.Group>
          </div>
          <div>
            <Dropdown
              menu={{
                items: peers.map((peer) => ({
                  key: peer.peerId,
                  label: (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <Badge status={badgeStatus[peer.status]} />
                      <div>{`${peer.name}(${peer.peerId})`}</div>
                    </div>
                  ),
                })),
              }}
              placement="topRight"
              arrow
            >
              <div>
                房间：
                {pathname === "/" ? "<public>" : pathname.replace("/", "")}
                ，人数：{peers.length}
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default Layout;