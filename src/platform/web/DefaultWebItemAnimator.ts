import ItemAnimator from "../../core/ItemAnimator";

export default class DefaultWebItemAnimator implements ItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private hasAnimatedOnce: boolean = false;
    public animateWillMount(atX: number, atY: number): void {
        //no need
    }
    public animateDidMount(atX: number, atY: number, itemRef: object): void {
        //no need
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        if (fromX !== toX || fromY !== toY) {
            const element = itemRef as HTMLDivElement;
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this.hasAnimatedOnce) {
                const transitionEndCallback: EventListener = (event) => {
                    element.style.transition = null;
                    element.removeEventListener("transitionend", transitionEndCallback);
                    this.hasAnimatedOnce = true;
                };
                element.style.transition = "transform 0.15s ease-out";
                element.addEventListener("transitionend", transitionEndCallback, false);
            }
        }
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object): void {
        //no need
    }
}
