import { Dimension } from "../../../..";
import ResizeDebugHandler from "./ResizeDebugHandler";

export default class DefaultResizeDebugHandler implements ResizeDebugHandler {
    private readonly relaxation: Dimension;
    private readonly onRelaxationViolation: (expectedDim: Dimension, actualDim: Dimension, index: number) => void;

    // Relaxation is the Dimension object where it accepts the relaxation to allow for each dimension.
    // Any of the dimension (height or width) whose value for relaxation is less than 0 would be ignored.
    public constructor(relaxation: Dimension, onRelaxationViolation: (expectedDim: Dimension, actualDim: Dimension, index: number) => void) {
        this.relaxation = relaxation;
        this.onRelaxationViolation = onRelaxationViolation;
    }

    public resizeDebug(oldDim: Dimension, newDim: Dimension, index: number): void {
        let isViolated: boolean = false;
        if (this.relaxation.height >= 0 && Math.abs(newDim.height - oldDim.height) >= this.relaxation.height) {
            isViolated = true;
        }

        if (!isViolated && this.relaxation.width >= 0 && Math.abs(newDim.width - oldDim.width) >= this.relaxation.width) {
            isViolated = true;
        }

        if (isViolated) {
            this.onRelaxationViolation(oldDim, newDim, index);
        }
    }
}
