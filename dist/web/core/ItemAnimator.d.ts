export default interface ItemAnimator {
    animateWillMount: (atX: number, atY: number, itemIndex: number) => object | undefined;
    animateDidMount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;
    animateWillUpdate: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => void;
    animateShift: (fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number) => boolean;
    animateWillUnmount: (atX: number, atY: number, itemRef: object, itemIndex: number) => void;
}
export declare class BaseItemAnimator implements ItemAnimator {
    static USE_NATIVE_DRIVER: boolean;
    animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined;
    animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
    animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void;
    animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean;
    animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void;
}
