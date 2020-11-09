import { Dimension } from "../dependencies/LayoutProvider";
import { LayoutManager, Layout } from "./LayoutManager";

export type GetTypeCallbackFn = (index: number) => string | number;
export type SetDimensionCallbackFn = (
    type: string | number,
    dim: Dimension,
    index: number,
) => void;

export class MasonryLayoutManager extends LayoutManager {
    private layouts: Layout[];

    private numOfColumn: number;
    private getTypeCallback: GetTypeCallbackFn;
    private setDimensionCallback: SetDimensionCallbackFn;
    private totalHeight: number;
    private totalWidth: number;
    private xStartArray: number[];

    public constructor(
        windowSize: Dimension,
        numOfColumn: number,
        getTypeCallback: GetTypeCallbackFn,
        setDimensionCallback: SetDimensionCallbackFn,
        _isHorizontal = false, // NOTE: horizontal orientation currently unsupported
        cachedLayouts?: Layout[],
    ) {
        super();
        this.numOfColumn = numOfColumn;
        this.getTypeCallback = getTypeCallback;
        this.setDimensionCallback = setDimensionCallback;
        this.totalHeight = 0;
        this.totalWidth = 0;

        this.xStartArray = new Array<number>(numOfColumn);
        for (let i = 0; i < numOfColumn; i++) {
            this.xStartArray[i] = (i / numOfColumn) * windowSize.width;
        }

        // starts empty or from cache
        this.layouts = cachedLayouts ? cachedLayouts : [];
    }

    public getContentDimension(): Dimension {
        return { height: this.totalHeight, width: this.totalWidth };
    }

    public getLayouts(): Layout[] {
        return this.layouts;
    }

    public overrideLayout(index: number, dim: Dimension): boolean {
        const layout = this.layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
        return true;
    }

    // NOTE: This method could be called multiple times.
    public relayoutFromIndex(startIndex: number, itemCount: number): void {
        let lowestColumnIdx = 0;

        const startVal: Layout = this.layouts[startIndex];
        if (startVal) {
            this.totalHeight = startVal.y;
            lowestColumnIdx = startVal.columnIdx ? startVal.columnIdx : this.getColumnOf(startVal);
        }

        const lowestColumnArray = this.getPrevLowestColumns(startIndex);

        const oldItemCount = this.layouts.length;
        const itemDim = { height: 0, width: 0 };
        let itemRect: Layout;
        let oldLayout: Layout;
        let itemY: number;

        for (let i = startIndex; i < itemCount; i++) {
            oldLayout = this.layouts[i];
            const layoutType = this.getTypeCallback(i);
            if (
                oldLayout &&
                oldLayout.isOverridden &&
                oldLayout.type === layoutType
            ) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            } else {
                this.setDimensionCallback(layoutType, itemDim, i);
            }

            itemY = lowestColumnArray[lowestColumnIdx];

            if (i > oldItemCount - 1) {
                this.layouts.push({
                    type: layoutType,
                    x: this.xStartArray[lowestColumnIdx],
                    y: itemY,
                    width: itemDim.width,
                    height: itemDim.height,
                    columnIdx: lowestColumnIdx,
                });
            } else {
                // NOTE: This relayout-modify phase is only executed if:
                // - forceNonDeterministicRendering=true. or,
                // - forceNonDeterministicRendering=false, but checkDimensionDiscrepancy() return true.

                itemRect = this.layouts[i];
                itemRect.type = layoutType;
                itemRect.x = this.xStartArray[lowestColumnIdx];
                itemRect.y = itemY;
                itemRect.width = itemDim.width;
                itemRect.height = itemDim.height;
                itemRect.columnIdx = lowestColumnIdx;
            }

            // now that this column has been filled, update its height
            lowestColumnArray[lowestColumnIdx] = itemY + itemDim.height;
            // and find another lowest column
            lowestColumnIdx = this.findIndexOfLowestValue(lowestColumnArray);

            this.totalHeight = this.findHighestValue(lowestColumnArray);
        }
    }

    private getColumnOf(layout: Layout): number {
        const xpos = this.xStartArray;
        for (let i = xpos.length - 1; i >= 0; i--) {
            if (layout.x >= xpos[i]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * For each column, get position of layout item that lowest than current index.
     *
     * TODO: This uses exhaustive search. Use more efficient structure & algorithm later.
     */
    private getPrevLowestColumns(curIdx: number): number[] {
        const lowestColumnArray = new Array<number>(this.numOfColumn).fill(
            Number.MAX_SAFE_INTEGER,
        );
        const curLayout = this.layouts[curIdx];
        if (!curLayout) {
            return lowestColumnArray.fill(0);
        }
        // for each column
        for (let columnIdx = 0; columnIdx < this.xStartArray.length; columnIdx++) {
            // if current layout is on this column
            if (columnIdx === curLayout.columnIdx) {
                // special, previous is y, not y+height
                lowestColumnArray[columnIdx] = curLayout.y;
                // search other column
                continue;
            }
            // for all previous layouts
            for (let layoutIdx = curIdx - 1; layoutIdx >= 0; layoutIdx--) {
                const prevlayout = this.layouts[layoutIdx];
                if (prevlayout.columnIdx === columnIdx) {
                    lowestColumnArray[columnIdx] = prevlayout.y + prevlayout.height;
                    // current column stop on this layout
                    break;
                }
            }
            // if no previous layouts found in this column
            if (lowestColumnArray[columnIdx] === Number.MAX_SAFE_INTEGER) {
                lowestColumnArray[columnIdx] = 0;
            }
        }
        return lowestColumnArray;
    }

    // TODO: This uses brute force search. Use efficient sort & search algorithm later.
    private findIndexOfLowestValue(array: number[]): number {
        let lowest = Number.MAX_SAFE_INTEGER;
        let lowestIdx = -1;
        for (let i = 0; i < array.length; i++) {
            const n = array[i];
            if (n < lowest) {
                lowest = n;
                lowestIdx = i;
            }
        }
        return lowestIdx;
    }

    // TODO: This uses brute force search. Use efficient sort & search algorithm later.
    private findHighestValue(array: number[]): number {
        let highest = 0;
        for (const n of array) {
            if (n === Number.MAX_SAFE_INTEGER) {
                continue;
            }
            if (n > highest) {
                highest = n;
            }
        }
        return highest;
    }
}
