import { DebugHandler } from "../DebugHandler";
import ResizeDebugConfig from "./ResizeDebugConfig";
import { Dimension } from "../../../..";
import DebugConfig from "../DebugConfig";

export default class ResizeDebugHandler implements DebugHandler {
    private readonly _resizeDebugConfig: ResizeDebugConfig;

    constructor(resizeDebugConfig: ResizeDebugConfig) {
        this._resizeDebugConfig = resizeDebugConfig;
    }

    public resizeDebug = (oldDim: Dimension, newDim: Dimension, index: number): void => {
        const expectedDim: Dimension = { width: 0, height: 0 };
        const actualDim: Dimension = { width: 0, height: 0 };
        let isViolated: boolean = false;
        if (this._resizeDebugConfig.relaxation.height >= 0 && Math.abs(newDim.height - oldDim.height) >= this._resizeDebugConfig.relaxation.height) {
            expectedDim.height = oldDim.height;
            actualDim.height = newDim.height;
            isViolated = true;
        }

        if (this._resizeDebugConfig.relaxation.width >= 0 && Math.abs(newDim.width - oldDim.width) >= this._resizeDebugConfig.relaxation.width) {
            expectedDim.width = oldDim.width;
            actualDim.width = newDim.width;
            isViolated = true;
        }

        if (isViolated) {
            this._resizeDebugConfig.onRelaxationViolation(expectedDim, actualDim, index);
        }
    }

    public getDebugConfig = (): DebugConfig => {
        return this._resizeDebugConfig;
    }
}
