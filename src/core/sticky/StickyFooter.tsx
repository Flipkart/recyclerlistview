/**
 * Created by ananya.chandra on 20/09/18.
 */

import StickyObject, {StickyObjectProps, StickyObjectState, StickyType, VisibleIndices} from "./StickyObject";

export default class StickyFooter<P extends StickyObjectProps, S extends StickyObjectState> extends StickyObject<P, S> {
    constructor(props: P, context?: any) {
        super(props, context);
    }

    protected initStickyParams(visibleIndices: VisibleIndices, currentIndice: number): void {
        this.stickyType = StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.initialVisibility = !visibleIndices[currentIndice + 1];
        this.containerPosition = {bottom: 0};
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
