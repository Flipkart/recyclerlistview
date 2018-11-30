/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";

export default class StickyHeader<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.HEADER;
        this.stickyTypeMultiplier = 1;
        this.containerPosition = {top: 0};
    }

    protected isInitiallyVisible(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number,
    ): void {
        if (stickyIndices) {
            if (smallestVisibleIndex < stickyIndices[0]) {
                this.initialVisibility = false;
            } else {
                this.initialVisibility = true;
                let i: number = 0;
                let resolved: boolean = false;
                let lastIndex: number = -1;
                for (const index of stickyIndices) {
                    if (smallestVisibleIndex < index) {
                        this.currentIndex = i - 1;
                        this.currentStickyIndex = lastIndex;
                        resolved = true;
                        break;
                    }
                    i++;
                    lastIndex = index;
                }
                if (!resolved) {
                    this.currentIndex = i - 1;
                    this.currentStickyIndex = lastIndex;
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
