/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType} from "./StickyObject";

export default class StickyFooter<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected initStickyParams(): void {
        this.stickyType = StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.containerPosition = {bottom: 0};
    }

    protected calculateVisibleStickyIndex(
        stickyIndices: number[] | undefined, smallestVisibleIndex: number, largestVisibleIndex: number,
    ): void {
        if (stickyIndices && largestVisibleIndex) {
            if (largestVisibleIndex > stickyIndices[stickyIndices.length - 1]) {
                this.stickyVisiblity = false;
            } else {
                this.stickyVisiblity = true;
                let resolved: boolean = false;
                let i = stickyIndices.length - 1;
                let lastIndex: number = -1;
                for (i; i >= 0; i--) {
                    const index = stickyIndices[i];
                    if (largestVisibleIndex > index) {
                        this.currentIndex = i + 1;
                        this.currentStickyIndex = lastIndex;
                        resolved = true;
                        break;
                    }
                    lastIndex = index;
                }
                if (!resolved) {
                    this.currentIndex = i + 1;
                    this.currentStickyIndex = lastIndex;
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
