import { ReactSketchCanvas } from "react-sketch-canvas";

const Pad: React.FC = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "calc(100vh - 50px)",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <ReactSketchCanvas
        width="100%"
        height="100%"
        canvasColor="#fff"
        strokeColor="#a855f7"
      />
    </div>
  );
};

export default Pad;
