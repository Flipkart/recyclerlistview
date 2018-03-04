import { Animated, Easing, ViewStatic, View } from "react-native";
import ItemAnimator from "../../../core/ItemAnimator";

/**
 * Default implementation of RLV layout animations for react native. These ones are purely JS driven. Also, check out DefaultNativeItemAnimator
 * for an implementation on top of LayoutAnimation. We didn't use it by default due the fact that LayoutAnimation is quite
 * unstable on Android and to avoid unnecessary interference with developer flow. It would be very easy to do so manually if
 * you need to. Check DefaultNativeItemAnimator for inspiration. LayoutAnimation definitely gives better performance but is
 * hardly customizable.
 */
export class DefaultJSItemAnimator implements ItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private _hasAnimatedOnce: boolean = false;
    private _isTimerOn: boolean = false;
    public animateWillMount(atX: number, atY: number, itemIndex: number): void {
        //no need
    }
    public animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        this._hasAnimatedOnce = true;
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean {
        if (fromX !== toX || fromY !== toY) {
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this._hasAnimatedOnce) {
                const viewRef = itemRef as View;
                const animXY = new Animated.ValueXY({ x: fromX, y: fromY });
                animXY.addListener((value) => {
                    viewRef.setNativeProps({ left: value.x, top: value.y });
                });
                Animated.timing(animXY, {
                    toValue: { x: toX, y: toY },
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                }).start(() => {
                    this._hasAnimatedOnce = true;
                });
                return true;
            }
        } else {
            if (!this._isTimerOn) {
                this._isTimerOn = true;
                if (!this._hasAnimatedOnce) {
                    setTimeout(() => {
                        this._hasAnimatedOnce = true;
                    }, 1000);
                }
            }
        }
        return false;
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }
}
