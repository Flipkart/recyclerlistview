/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";
import BinarySearch, {ValueAndIndex} from "../../utils/BinarySearch";

export default class StickyFooter<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    private _initialOnScroll: boolean = true;

    constructor(props: P, context?: any) {
        super(props, context);
    }

    public onEndReached(): void {
        this._stickyViewVisible(false);
        this.boundaryReached = true;
    }

    protected boundaryProcessing(): void {
        if (this.boundaryReached && !this._initialOnScroll) {
            this.boundaryReached = false;
            this.onVisibleIndicesChanged(this.visibleIndices);
        }
        this._initialOnScroll = false;
    }

    protected initStickyParams(_offsetY: number): void {
        this.stickyType = StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.containerPosition = {bottom: 0};
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, _smallestVisibleIndex: number, largestVisibleIndex: number, _offsetY: number,
    ): void {
        if (stickyIndices && largestVisibleIndex && !this.boundaryReached) {
            if (largestVisibleIndex > stickyIndices[stickyIndices.length - 1]) {
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

    protected getScrollY(offsetY: number, scrollableHeight: number): number | null {
        return scrollableHeight ? -1 * (offsetY + scrollableHeight) : null;
    }
}
