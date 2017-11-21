/***
 * Computes the positions and dimensions of items that will be rendered by the list. The output from this is utilized by viewability tracker to compute the
 * lists of visible/hidden item.
 * Note: In future, this will also become an external dependency which means you can write your own layout manager. That will enable everyone to layout their
 * views just the way they want. Current implementation is a StaggeredList
 */
import LayoutProvider, { Dimension } from "../dependencies/LayoutProvider";
import CustomError from "../exceptions/CustomError";

export default class LayoutManager {
    private _layoutProvider: LayoutProvider;
    private _window: Dimension;
    private _totalHeight: number;
    private _totalWidth: number;
    private _layouts: Rect[];
    private _isHorizontal: boolean;

    constructor(layoutProvider: LayoutProvider, dimensions: Dimension, isHorizontal: boolean = false, cachedLayouts?: Rect[]) {
        this._layoutProvider = layoutProvider;
        this._window = dimensions;
        this._totalHeight = 0;
        this._totalWidth = 0;
        this._layouts = cachedLayouts ? cachedLayouts : [];
        this._isHorizontal = isHorizontal;
    }

    public getLayoutDimension(): Dimension {
        return { height: this._totalHeight, width: this._totalWidth };
    }

    public getLayouts(): Rect[] {
        return this._layouts;
    }

    public getOffsetForIndex(index: number): Point {
        if (this._layouts.length > index) {
            return { x: this._layouts[index].x, y: this._layouts[index].y };
        } else {
            throw new CustomError({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    }

    public overrideLayout(index: number, dim: Dimension): void {
        const layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
    }

    public setMaxBounds(itemDim: Dimension): void {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        } else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    }

    //TODO:Talha laziliy calculate in future revisions
    public reLayoutFromIndex(startIndex: number, itemCount: number): void {
        startIndex = this._locateFirstNeighbourIndex(startIndex);
        let startX = 0;
        let startY = 0;
        let maxBound = 0;

        const startVal = this._layouts[startIndex];

        if (startVal) {
            startX = startVal.x;
            startY = startVal.y;
            this._pointDimensionsToRect(startVal);
        }

        const oldItemCount = this._layouts.length;

        const itemDim = { height: 0, width: 0 };
        let itemRect = null;

        let oldLayout = null;

        for (let i = startIndex; i < itemCount; i++) {
            oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            } else {
                this._layoutProvider.setLayoutForType(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);
            while (!this._checkBounds(startX, startY, itemDim, this._isHorizontal)) {
                if (this._isHorizontal) {
                    startX += maxBound;
                    startY = 0;
                    this._totalWidth += maxBound;
                } else {
                    startX = 0;
                    startY += maxBound;
                    this._totalHeight += maxBound;
                }
                maxBound = 0;
            }

            maxBound = this._isHorizontal ? Math.max(maxBound, itemDim.width) : Math.max(maxBound, itemDim.height);

            //TODO: Talha creating array upfront will speed this up
            if (i > oldItemCount - 1) {
                this._layouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            } else {
                itemRect = this._layouts[i];
                itemRect.x = startX;
                itemRect.y = startY;
                itemRect.width = itemDim.width;
                itemRect.height = itemDim.height;
            }

            if (this._isHorizontal) {
                startY += itemDim.height;
            } else {
                startX += itemDim.width;
            }
        }
        if (oldItemCount > itemCount) {
            this._layouts.splice(itemCount, oldItemCount - itemCount);
        }
        this._setFinalDimensions(maxBound);
    }

    private _pointDimensionsToRect(itemRect: Rect): void {
        if (this._isHorizontal) {
            this._totalWidth = itemRect.x;
        } else {
            this._totalHeight = itemRect.y;
        }
    }

    private _setFinalDimensions(maxBound: number): void {
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        } else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    }

    private _locateFirstNeighbourIndex(startIndex: number): number {
        if (startIndex === 0) {
            return 0;
        }
        let i = startIndex - 1;
        for (; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[i].y === 0) {
                    break;
                }
            } else if (this._layouts[i].x === 0) {
                break;
            }
        }
        return i;
    }

    private _checkBounds(itemX: number, itemY: number, itemDim: Dimension, isHorizontal: boolean): boolean {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    }
}

export interface Rect extends Dimension, Point {
    isOverridden?: boolean;
}
export interface Point {
    x: number;
    y: number;
}
