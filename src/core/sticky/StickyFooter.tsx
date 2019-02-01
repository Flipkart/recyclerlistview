/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";
import BinarySearch, {ValueAndIndex} from "../../utils/BinarySearch";

export default class StickyFooter<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    private _bounceScrolling: boolean = true;
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected boundaryProcessing(offsetY: number, windowBound?: number): void {
        if (this._hasReachedEnd(offsetY, windowBound)) {
            this._bounceScrolling = true;
            this.stickyViewVisible(false);
        } else if (!this._hasReachedEnd(offsetY, windowBound) && this._bounceScrolling) {
            this._bounceScrolling = false;
            this.onVisibleIndicesChanged(this.visibleIndices);
        }
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.containerPosition = {bottom: 0};
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, _smallestVisibleIndex: number, largestVisibleIndex: number,
    ): void {
        if (stickyIndices && largestVisibleIndex) {
            if (largestVisibleIndex > stickyIndices[stickyIndices.length - 1] || this._bounceScrolling) {
                this.stickyVisiblity = false;
            } else {
                this.stickyVisiblity = true;
                const valueAndIndex: ValueAndIndex | undefined = BinarySearch.findValueLargerThanTarget(stickyIndices, largestVisibleIndex);
                if (valueAndIndex) {
                    this.currentIndex = valueAndIndex.index;
                    this.currentStickyIndex = valueAndIndex.value;
                } else {
                    console.log("Footer sticky index calculation gone wrong."); //tslint:disable-line
                }
            }
        }
    }

    protected getNextYd(nextY: number, nextHeight: number): number {
        return -1 * (nextY + nextHeight);
    }

    protected getCurrentYd(currentY: number, currentHeight: number): number {
        return -1 * (currentY + currentHeight);
    }

    protected getScrollY(offsetY: number, scrollableHeight: number): number | undefined {
        return scrollableHeight ? -1 * (offsetY + scrollableHeight) : undefined;
    }

    private _hasReachedEnd(offsetY: number, windowBound?: number): boolean {
        return windowBound ? offsetY >= windowBound : false;
    }
}
