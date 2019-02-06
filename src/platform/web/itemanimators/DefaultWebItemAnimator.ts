import { BaseItemAnimator } from "../../../core/ItemAnimator";

/**
 * Default implementation of RLV layout animations for web. We simply hook in transform transitions to beautifully animate all
 * shift events.
 */
export class DefaultWebItemAnimator implements BaseItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private _hasAnimatedOnce: boolean = false;
    private _isTimerOn: boolean = false;
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
            const element = itemRef as HTMLDivElement;
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this._hasAnimatedOnce) {
                const transitionEndCallback: EventListener = (event) => {
                    element.style.transition = "";
                    element.removeEventListener("transitionend", transitionEndCallback);
                    this._hasAnimatedOnce = true;
                };
                element.style.transition = "transform 0.15s ease-out";
                element.addEventListener("transitionend", transitionEndCallback, false);
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
