import { Dimension } from "../../../..";

export default interface ResizeDebugHandler {
    resizeDebug(oldDim: Dimension, newDim: Dimension, index: number): void;
}
