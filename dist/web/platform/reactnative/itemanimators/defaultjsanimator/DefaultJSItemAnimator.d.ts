import { BaseItemAnimator } from "../../../../core/ItemAnimator";
/**
 * Default implementation of RLV layout animations for react native. These ones are purely JS driven. Also, check out DefaultNativeItemAnimator
 * for an implementation on top of LayoutAnimation. We didn't use it by default due the fact that LayoutAnimation is quite
 * unstable on Android and to avoid unnecessary interference with developer flow. It would be very easy to do so manually if
 * you need to. Check DefaultNativeItemAnimator for inspiration. LayoutAnimation definitely gives better performance but is
 * hardly customizable.
 */
export declare class DefaultJSItemAnimator implements BaseItemAnimator {
    shouldAnimateOnce: boolean;
    private _hasAnimatedOnce;
    private _isTimerOn;
    animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined;
    animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
    animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void;
    animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean;
    animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
    private _getNativePropObject;
}
