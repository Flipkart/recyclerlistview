/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";
import BinarySearch, {ValueAndIndex} from "../../utils/BinarySearch";

export default class StickyHeader<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    private _normalScrollingResumed: boolean = true;
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected boundaryProcessing(offsetY: number, _scrollableHeight?: number): void {
        if (this._hasReachedStart(offsetY)) {
            this._normalScrollingResumed = false;
            this.stickyViewVisible(false);
        } else if (!this._hasReachedStart(offsetY) && !this._normalScrollingResumed) {
            this._normalScrollingResumed = true;
            this.onVisibleIndicesChanged(this.visibleIndices);
        }
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.HEADER;
        this.stickyTypeMultiplier = 1;
        this.containerPosition = {top: 0};
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number,
    ): void {
        if (stickyIndices && smallestVisibleIndex !== undefined) {
            if (smallestVisibleIndex < stickyIndices[0] || offsetY <= 0) {
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

    private _hasReachedStart(offsetY: number): boolean {
        return offsetY <= 0;
    }
}
