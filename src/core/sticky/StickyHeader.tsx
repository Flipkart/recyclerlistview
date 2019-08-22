/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyType} from "./StickyObject";
import BinarySearch, {ValueAndIndex} from "../../utils/BinarySearch";

export default class StickyHeader<P extends StickyObjectProps> extends StickyObject<P> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.HEADER;
        this.stickyTypeMultiplier = 1;
        this.containerPosition = {top: 0};

        // Kept as true contrary to as in StickyFooter because in case of initialOffset not given, onScroll isn't called and boundaryProcessing isn't done.
        // Default behaviour in that case will be sticky header hidden.
        this.bounceScrolling = true;
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number, distanceFromWindow: number,
    ): void {
        if (stickyIndices && smallestVisibleIndex !== undefined) {
            this.bounceScrolling = this.hasReachedBoundary(offsetY, distanceFromWindow);
            if (smallestVisibleIndex < stickyIndices[0] || this.bounceScrolling) {
                this.stickyVisiblity = false;
            } else {
                this.stickyVisiblity = true;
                const valueAndIndex: ValueAndIndex | undefined = BinarySearch.findValueSmallerThanTarget(stickyIndices, smallestVisibleIndex);
                if (valueAndIndex) {
                    this.currentIndex = valueAndIndex.index;
                    this.currentStickyIndex = valueAndIndex.value;
                } else {
                    console.log("Header sticky index calculation gone wrong."); //tslint:disable-line
                }
            }
        }
    }

    protected getNextYd(nextY: number, nextHeight: number): number {
        return nextY;
    }

    protected getCurrentYd(currentY: number, currentHeight: number): number {
        return currentY;
    }

    protected getScrollY(offsetY: number, scrollableHeight: number): number | undefined {
        return offsetY;
    }

    protected hasReachedBoundary(offsetY: number, distanceFromWindow: number, _windowBound?: number): boolean {
        return offsetY <= distanceFromWindow;
    }
}
