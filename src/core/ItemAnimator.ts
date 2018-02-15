export default interface ItemAnimator {
    //Web uses tranforms for moving items while react native uses left, top
    //In case of native itemRef will be a View and in web div element so, override accordingly
    animateMount: (atX: number, atY: number, itemRef?: object) => void;
    animateUpdate: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object) => void;
    animateShift: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object) => void;
    animateUnmount: (atX: number, atY: number, itemRef: object) => void;
}
