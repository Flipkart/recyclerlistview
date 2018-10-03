import { Dimension } from "../../..";
import DebugConfig from "./DebugConfig";

export interface DebugHandler {
    getDebugConfig: () => DebugConfig;
    resizeDebug?: (oldDim: Dimension, newDim: Dimension, index: number) => void;
}
