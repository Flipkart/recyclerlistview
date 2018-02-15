import ItemAnimator from "../../core/ItemAnimator";

export default class DefaultWebItemAnimator implements ItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private hasAnimatedOnce: boolean = false;
    public animateMount(atX: number, atY: number, itemRef?: object): void {
        //no need
    }
    public animateUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        const element = itemRef as HTMLDivElement;
        if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this.hasAnimatedOnce) {
            const transitionEndCallback: EventListener = (event) => {
                element.style.transition = null;
                element.removeEventListener("transitionend", transitionEndCallback);
                this.hasAnimatedOnce = true;
            };
            element.style.transition = "transform .15s ease-out";
            element.addEventListener("transitionend", transitionEndCallback, false);
        }
    }

    public animateUnmount(atX: number, atY: number, itemRef: object): void {
        //no need
    }
}
