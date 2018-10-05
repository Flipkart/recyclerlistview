import { Dimension } from "../../../..";

export default interface IResizeDebugHandler {
    resizeDebug(oldDim: Dimension, newDim: Dimension, index: number): void;
}
