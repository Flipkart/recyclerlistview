import { Dimension } from "../../../..";
import ResizeDebugHandler from "./ResizeDebugHandler";
export default class DefaultResizeDebugHandler implements ResizeDebugHandler {
    private readonly relaxation;
    private readonly onRelaxationViolation;
    constructor(relaxation: Dimension, onRelaxationViolation: (expectedDim: Dimension, actualDim: Dimension, index: number) => void);
    resizeDebug(oldDim: Dimension, newDim: Dimension, index: number): void;
}
