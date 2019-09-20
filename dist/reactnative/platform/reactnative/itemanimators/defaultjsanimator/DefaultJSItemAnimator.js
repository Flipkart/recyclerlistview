"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var ItemAnimator_1 = require("../../../../core/ItemAnimator");
/**
 * Default implementation of RLV layout animations for react native. These ones are purely JS driven. Also, check out DefaultNativeItemAnimator
 * for an implementation on top of LayoutAnimation. We didn't use it by default due the fact that LayoutAnimation is quite
 * unstable on Android and to avoid unnecessary interference with developer flow. It would be very easy to do so manually if
 * you need to. Check DefaultNativeItemAnimator for inspiration. LayoutAnimation definitely gives better performance but is
 * hardly customizable.
 */
var DefaultJSItemAnimator = /** @class */ (function () {
    function DefaultJSItemAnimator() {
        this.shouldAnimateOnce = true;
        this._hasAnimatedOnce = false;
        this._isTimerOn = false;
    }
    DefaultJSItemAnimator.prototype.animateWillMount = function (atX, atY, itemIndex) {
        return undefined;
    };
    DefaultJSItemAnimator.prototype.animateDidMount = function (atX, atY, itemRef, itemIndex) {
        //no need
    };
    DefaultJSItemAnimator.prototype.animateWillUpdate = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        this._hasAnimatedOnce = true;
    };
    DefaultJSItemAnimator.prototype.animateShift = function (fromX, fromY, toX, toY, itemRef, itemIndex) {
        var _this = this;
        if (fromX !== toX || fromY !== toY) {
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this._hasAnimatedOnce) {
                var viewRef_1 = itemRef;
                var animXY_1 = new react_native_1.Animated.ValueXY({ x: fromX, y: fromY });
                animXY_1.addListener(function (value) {
                    if (viewRef_1._isUnmountedForRecyclerListView || (_this.shouldAnimateOnce && _this._hasAnimatedOnce)) {
                        animXY_1.stopAnimation();
                        return;
                    }
                    viewRef_1.setNativeProps(_this._getNativePropObject(value.x, value.y));
                });
                if (viewRef_1._lastAnimVal) {
                    viewRef_1._lastAnimVal.stopAnimation();
                }
                viewRef_1._lastAnimVal = animXY_1;
                react_native_1.Animated.timing(animXY_1, {
                    toValue: { x: toX, y: toY },
                    duration: 200,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: ItemAnimator_1.BaseItemAnimator.USE_NATIVE_DRIVER,
                }).start(function () {
                    viewRef_1._lastAnimVal = null;
                    _this._hasAnimatedOnce = true;
                });
                return true;
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
    DefaultJSItemAnimator.prototype.animateWillUnmount = function (atX, atY, itemRef, itemIndex) {
        itemRef._isUnmountedForRecyclerListView = true;
    };
    DefaultJSItemAnimator.prototype._getNativePropObject = function (x, y) {
        return { style: { left: x, top: y } };
    };
    return DefaultJSItemAnimator;
}());
exports.DefaultJSItemAnimator = DefaultJSItemAnimator;
//# sourceMappingURL=DefaultJSItemAnimator.js.map