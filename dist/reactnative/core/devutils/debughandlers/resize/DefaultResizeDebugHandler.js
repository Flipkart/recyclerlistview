"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultResizeDebugHandler = /** @class */ (function () {
    // Relaxation is the Dimension object where it accepts the relaxation to allow for each dimension.
    // Any of the dimension (height or width) whose value for relaxation is less than 0 would be ignored.
    function DefaultResizeDebugHandler(relaxation, onRelaxationViolation) {
        this.relaxation = relaxation;
        this.onRelaxationViolation = onRelaxationViolation;
    }
    DefaultResizeDebugHandler.prototype.resizeDebug = function (oldDim, newDim, index) {
        var isViolated = false;
        if (this.relaxation.height >= 0 && Math.abs(newDim.height - oldDim.height) >= this.relaxation.height) {
            isViolated = true;
        }
        if (!isViolated && this.relaxation.width >= 0 && Math.abs(newDim.width - oldDim.width) >= this.relaxation.width) {
            isViolated = true;
        }
        if (isViolated) {
            this.onRelaxationViolation(oldDim, newDim, index);
        }
    };
    return DefaultResizeDebugHandler;
}());
exports.default = DefaultResizeDebugHandler;
//# sourceMappingURL=DefaultResizeDebugHandler.js.map