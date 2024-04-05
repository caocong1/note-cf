import { Button, Input, Modal, notification } from "antd";
import { useAtom, useSetAtom } from "jotai";
import { myNameAtom, peersAtom } from "../atom";
import { useState } from "react";
import request from "../request";
import { myPeerId, sendDataToPeers } from "../peer";

const ChangeName: React.FC = () => {
  const [myName, setMyName] = useAtom(myNameAtom);
  const setPeers = useSetAtom(peersAtom);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <>
      <div
        style={{ cursor: "pointer", color: "#1565c0" }}
        onClick={() => {
          setOpen(true);
        }}
      >
        {myName}
      </div>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        title="修改昵称"
        footer={
          <Button
            onClick={() => {
              if (value === "") {
                notification.error({ message: "昵称不能为空" });
                return;
              }
              setOpen(false);
              sendDataToPeers({
                type: "change-name",
                data: {
                  peerId: myPeerId,
                  name: value,
                },
              });
              request("change-name", {
                pathname: location.pathname,
                peerId: myPeerId,
                name: value,
              });
              setMyName(value);
              setPeers((old) =>
                old.map((peer) => {
                  if (peer.peerId === myPeerId) {
                    peer.name = value;
                  }
                  return peer;
                }),
              );
            }}
          >
            确定
          </Button>
        }
      >
        <Input
          placeholder="请输入昵称"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
      </Modal>
    </>
  );
};
export default ChangeName;
