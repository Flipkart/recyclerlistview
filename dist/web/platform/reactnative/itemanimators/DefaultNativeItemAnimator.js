"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var DefaultNativeItemAnimator = /** @class */ (function () {
    function DefaultNativeItemAnimator() {
        this.shouldAnimateOnce = true;
        this._hasAnimatedOnce = false;
        this._isTimerOn = false;
        if (react_native_1.Platform.OS === "android" && react_native_1.UIManager.setLayoutAnimationEnabledExperimental) {
            react_native_1.UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
    DefaultNativeItemAnimator.prototype.animateWillMount = function (atX, atY, itemIndex) {
        return undefined;
    };
    DefaultNativeItemAnimator.prototype.animateDidMount = function (atX, atY, itemRef, itemIndex) {
        //no need
    };
    DefaultNativeItemAnimator.prototype.animateWillUpdate = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        this._hasAnimatedOnce = true;
    };
    DefaultNativeItemAnimator.prototype.animateShift = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        var _this = this;
        if (fromX !== toX || fromY !== toY) {
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this._hasAnimatedOnce) {
                react_native_1.LayoutAnimation.configureNext(react_native_1.LayoutAnimation.Presets.easeInEaseOut);
                this._hasAnimatedOnce = true;
            }
        }
        else {
            if (!this._isTimerOn) {
                this._isTimerOn = true;
                if (!this._hasAnimatedOnce) {
                    setTimeout(function () {
                        _this._hasAnimatedOnce = true;
                    }, 1000);
                }
            }
        }
        return false;
    };
    DefaultNativeItemAnimator.prototype.animateWillUnmount = function (atX, atY, itemRef, itemIndex) {
        //no need
    };
    return DefaultNativeItemAnimator;
}());
exports.DefaultNativeItemAnimator = DefaultNativeItemAnimator;
//# sourceMappingURL=DefaultNativeItemAnimator.js.map