export default interface ItemAnimator {
    //Web uses tranforms for moving items while react native uses left, top
    //IMPORTANT: In case of native itemRef will be a View and in web/RNW div element so, override accordingly.

    //Just an external trigger, no itemRef available, you can return initial style overrides here i.e, let's say if you want to
    //set initial opacity to 0 you can do: return { opacity: 0 };
    animateWillMount: (atX: number, atY: number, itemIndex: number) => object | undefined;

    //Called after mount, item may already be visible when this is called. Handle accordingly
    animateDidMount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;

    //Will be called if RLV cell is going to re-render, note that in case of non deterministic rendering width changes from layout
    //provider do not force re-render while they do so in deterministic. A re-render will apply the new layout which may cause a
    //jitter if you're in the middle of an animation. You need to handle those scenarios
    animateWillUpdate: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => void;

    //If handled return true, RLV may appropriately skip the render cycle to avoid UI jitters. This callback indicates that there
    //is no update in the cell other than its position
    animateShift: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => boolean;

    //Called before unmount
    animateWillUnmount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;
}

export class BaseItemAnimator implements ItemAnimator {
    public static USE_NATIVE_DRIVER = false;
    public animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined {
        return undefined;
    }
    public animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean {
        return false;
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }
}
