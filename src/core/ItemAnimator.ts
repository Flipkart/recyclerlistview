export default interface ItemAnimator {
    //Web uses tranforms for moving items while react native uses left, top
    //In case of native itemRef will be a View and in web div element so, override accordingly

    //Just an external trigger, no itemRef available
    animateWillMount: (atX: number, atY: number, itemIndex: number) => void;
    animateDidMount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;
    animateWillUpdate: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => void;
    animateShift: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => void;
    animateWillUnmount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;
}

export class BaseItemAnimator implements ItemAnimator {
    public animateWillMount(atX: number, atY: number, itemIndex: number): void {
        //no need
    }
    public animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        //no need
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        //no need
    }
}
