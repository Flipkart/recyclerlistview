import { LayoutAnimation, Platform, UIManager } from "react-native";
import { BaseItemAnimator } from "../../../core/ItemAnimator";

export class DefaultNativeItemAnimator implements BaseItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private _hasAnimatedOnce: boolean = false;
    private _isTimerOn: boolean = false;
    constructor() {
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
    public animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined {
        return undefined;
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
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                this._hasAnimatedOnce = true;
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
