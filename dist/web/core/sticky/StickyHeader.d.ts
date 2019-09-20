/**
 * Created by ananya.chandra on 20/09/18.
 */
import StickyObject, { StickyObjectProps, StickyObjectState } from "./StickyObject";
export default class StickyHeader<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    constructor(props: P, context?: any);
    protected initStickyParams(): void;
    protected calculateVisibleStickyIndex(stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number, distanceFromWindow: number): void;
    protected getNextYd(nextY: number, nextHeight: number): number;
    protected getCurrentYd(currentY: number, currentHeight: number): number;
    protected getScrollY(offsetY: number, scrollableHeight: number): number | undefined;
    protected hasReachedBoundary(offsetY: number, distanceFromWindow: number, _windowBound?: number): boolean;
}
