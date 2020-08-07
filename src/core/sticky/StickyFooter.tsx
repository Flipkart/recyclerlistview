/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, { StickyObjectProps, StickyType } from "./StickyObject";
import BinarySearch, { ValueAndIndex } from "../../utils/BinarySearch";
import { WindowCorrection } from "../ViewabilityTracker";

export interface StickyFooterProps extends StickyObjectProps {
    alwaysStickyFooter?: boolean;
}

export default class StickyFooter<P extends StickyFooterProps> extends StickyObject<P> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    public onScroll(offsetY: number): void {
        const endCorrection = this.getWindowCorrection(this.props).endCorrection;
        if (endCorrection) {
            this.containerPosition = { bottom: endCorrection };
            offsetY -= endCorrection;
        }
        super.onScroll(offsetY);
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.containerPosition = { bottom: this.getWindowCorrection(this.props).endCorrection };
        this.bounceScrolling = false;
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, _smallestVisibleIndex: number, largestVisibleIndex: number, offsetY: number, windowBound?: number): void {
        if (stickyIndices && largestVisibleIndex) {
            this.bounceScrolling = this.hasReachedBoundary(offsetY, windowBound);
            if (largestVisibleIndex > stickyIndices[stickyIndices.length - 1] || this.bounceScrolling) {
                this.stickyVisiblity = false;
                //This is needed only in when the window is non-scrollable.
                if (this.props.alwaysStickyFooter && offsetY === 0) {
                    this.stickyVisiblity = true;
                }
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

    protected hasReachedBoundary(offsetY: number, windowBound?: number): boolean {
        if (windowBound !== undefined) {
            const endReachedMargin = Math.round(offsetY - (windowBound));
            return endReachedMargin >= 0;
        }
        return false;
    }
}
