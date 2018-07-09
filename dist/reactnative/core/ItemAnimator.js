"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseItemAnimator = /** @class */ (function () {
    function BaseItemAnimator() {
    }
    BaseItemAnimator.prototype.animateWillMount = function (atX, atY, itemIndex) {
        return undefined;
    };
    BaseItemAnimator.prototype.animateDidMount = function (atX, atY, itemRef, itemIndex) {
        //no need
    };
    BaseItemAnimator.prototype.animateWillUpdate = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        //no need
    };
    BaseItemAnimator.prototype.animateShift = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        return false;
    };
    BaseItemAnimator.prototype.animateWillUnmount = function (atX, atY, itemRef, itemIndex) {
        //no need
    };
    BaseItemAnimator.USE_NATIVE_DRIVER = true;
    return BaseItemAnimator;
}());
exports.BaseItemAnimator = BaseItemAnimator;
//# sourceMappingURL=ItemAnimator.js.map