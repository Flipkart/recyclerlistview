import { BaseItemAnimator } from "../../../core/ItemAnimator";
/**
 * Default implementation of RLV layout animations for web. We simply hook in transform transitions to beautifully animate all
 * shift events.
 */
export declare class DefaultWebItemAnimator implements BaseItemAnimator {
    shouldAnimateOnce: boolean;
    private _hasAnimatedOnce;
    private _isTimerOn;
    animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined;
    animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
    animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void;
    animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean;
    animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
}
