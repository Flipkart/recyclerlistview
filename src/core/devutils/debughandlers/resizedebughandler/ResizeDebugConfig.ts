import { Dimension } from "../../../..";
import DebugConfig from "../DebugConfig";

export default interface ResizeDebugConfig extends DebugConfig {
    relaxation: Dimension;
    onRelaxationViolation: (expectedDim: Dimension, actualDim: Dimension, index: number) => void;
    forceEnable?: boolean;
}
