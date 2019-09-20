import { BaseItemAnimator } from "../../../core/ItemAnimator";
export declare class DefaultNativeItemAnimator implements BaseItemAnimator {
    shouldAnimateOnce: boolean;
    private _hasAnimatedOnce;
    private _isTimerOn;
    constructor();
    animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined;
    animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
    animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void;
    animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean;
    animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
}
