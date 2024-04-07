import { RefObject, useRef } from "react";
import { ReactSketchCanvasRef } from "react-sketch-canvas";

export let boardRef: RefObject<ReactSketchCanvasRef> | undefined;

export const useBoardRef = () => {
  boardRef = useRef<ReactSketchCanvasRef>(null);
  return boardRef;
};
