import { roomName, sendDataToPeers } from "./peer";
import request from "./request";

const Note: React.FC = () => {
  return (
    <div
      id="content"
      contentEditable
      style={{
        width: "100vw",
        height: "calc(100vh - 50px)",
        boxSizing: "border-box",
        padding: 8,
        overflow: "auto",
      }}
      onInput={(e: any) => {
        sendDataToPeers({ type: "note-change", data: e.target.innerHTML });
        request("note-change", {
          pathname: roomName,
          data: e.target.innerHTML,
        });
      }}
    />
  );
};

export default Note;
