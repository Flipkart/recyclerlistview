/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";
import BinarySearch, {ValueAndIndex} from "../../utils/BinarySearch";

export default class StickyHeader<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    public onStartReached(): void {
        this._stickyViewVisible(false);
        this.boundaryReached = true;
    }

    protected boundaryProcessing(): void {
        if (this.boundaryReached) {
            this.boundaryReached = false;
            this.onVisibleIndicesChanged(this.visibleIndices);
        }
    }

    protected initStickyParams(offsetY: number): void {
        this.stickyType = StickyType.HEADER;
        this.stickyTypeMultiplier = 1;
        this.containerPosition = {top: 0};
        if (offsetY === 0) {
            this.boundaryReached = true;
        }
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number,
    ): void {
        if (stickyIndices && smallestVisibleIndex !== undefined) {
            if (smallestVisibleIndex < stickyIndices[0] || offsetY === 0) {
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

    protected getScrollY(offsetY: number, scrollableHeight: number): number | null {
        return offsetY;
    }
}
