export interface Scrollable {
    scrollToOffset(x: number, y: number, animate: boolean): void;
}
export declare class AutoScroll {
    static scrollNow(scrollable: Scrollable, fromX: number, fromY: number, toX: number, toY: number, speedMultiplier?: number): Promise<void>;
}
