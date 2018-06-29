/***
 * Computes the positions and dimensions of items that will be rendered by the list. The output from this is utilized by viewability tracker to compute the
 * lists of visible/hidden item.
 */
import {
  Dimension,
  LayoutProvider,
  GridLayoutProvider,
} from "../dependencies/LayoutProvider";
import CustomError from "../exceptions/CustomError";

export abstract class LayoutManager {
  public getOffsetForIndex(index: number): Point {
    const layouts = this.getLayouts();
    if (layouts.length > index) {
      return { x: layouts[index].x, y: layouts[index].y };
    } else {
      throw new CustomError({
        message: "No layout available for index: " + index,
        type: "LayoutUnavailableException",
      });
    }
  }

  //You can ovveride this incase you want to override style in some cases e.g, say you want to enfore width but not height
  public getStyleOverridesForIndex(index: number): object | undefined {
    return undefined;
  }

  //Return the dimension of entire content inside the list
  public abstract getContentDimension(): Dimension;

  //Return all computed layouts as an array, frequently called, you are expected to return a cached array. Don't compute here.
  public abstract getLayouts(): Layout[];

  //RLV will call this method in case of mismatch with actual rendered dimensions in case of non deterministic rendering
  //You are expected to cache this value and prefer it over estimates provided
  //No need to relayout which RLV will trigger. You should only relayout when relayoutFromIndex is called.
  public abstract overrideLayout(index: number, dim: Dimension): void;

  //Recompute layouts from given index, compute heavy stuff should be here
  public abstract relayoutFromIndex(
    startIndex: number,
    itemCount: number,
  ): void;
}

export class WrapGridLayoutManager extends LayoutManager {
  private _layoutProvider: LayoutProvider;
  private _window: Dimension;
  private _totalHeight: number;
  private _totalWidth: number;
  private _isHorizontal: boolean;
  private _layouts: Layout[];

  constructor(
    layoutProvider: LayoutProvider,
    renderWindowSize: Dimension,
    isHorizontal: boolean = false,
    cachedLayouts?: Layout[],
  ) {
    super();
    this._layoutProvider = layoutProvider;
    this._window = renderWindowSize;
    this._totalHeight = 0;
    this._totalWidth = 0;
    this._isHorizontal = !!isHorizontal;
    this._layouts = cachedLayouts ? cachedLayouts : [];
  }

  public getContentDimension(): Dimension {
    return { height: this._totalHeight, width: this._totalWidth };
  }

  public getLayouts(): Layout[] {
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
  public relayoutFromIndex(startIndex: number, itemCount: number): void {
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
        this._layoutProvider.setComputedLayout(
          this._layoutProvider.getLayoutTypeForIndex(i),
          itemDim,
          i,
        );
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

      maxBound = this._isHorizontal
        ? Math.max(maxBound, itemDim.width)
        : Math.max(maxBound, itemDim.height);

      //TODO: Talha creating array upfront will speed this up
      if (i > oldItemCount - 1) {
        this._layouts.push({
          x: startX,
          y: startY,
          height: itemDim.height,
          width: itemDim.width,
        });
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

  private _pointDimensionsToRect(itemRect: Layout): void {
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

  private _checkBounds(
    itemX: number,
    itemY: number,
    itemDim: Dimension,
    isHorizontal: boolean,
  ): boolean {
    return isHorizontal
      ? itemY + itemDim.height <= this._window.height
      : itemX + itemDim.width <= this._window.width;
  }
}

export class GridLayoutManager extends WrapGridLayoutManager {
  private _maxSpan: number;
  private _getSpanForIndex: (index: number) => number;
  private _isGridHorizontal: boolean | undefined;
  private _renderWindowSize: Dimension;
  constructor(
    layoutProvider: GridLayoutProvider,
    renderWindowSize: Dimension,
    getSpanForIndex: (index: number) => number,
    maxSpan: () => number,
    isHorizontal?: boolean,
    cachedLayouts?: Layout[],
  ) {
    super(layoutProvider, renderWindowSize, isHorizontal, cachedLayouts);
    this._getSpanForIndex = getSpanForIndex;
    this._isGridHorizontal = isHorizontal;
    this._renderWindowSize = renderWindowSize;
    if (maxSpan() === 0 || maxSpan() === undefined) {
      throw new CustomError({
        message: "Max Column Span cannot be 0 or undefined",
        type: "NotSupportedException",
      });
    } else {
      this._maxSpan = maxSpan();
    }
  }

  public getStyleOverridesForIndex(index: number): object | undefined {
    const columnSpanForIndex = this._getSpanForIndex(index);
    return this._isGridHorizontal
      ? {
          height:
            (this._renderWindowSize.height / this._maxSpan) * columnSpanForIndex,
        }
      : {
          width:
            (this._renderWindowSize.width / this._maxSpan) * columnSpanForIndex,
        };
  }
}

export interface Layout extends Dimension, Point {
  isOverridden?: boolean;
}
export interface Point {
  x: number;
  y: number;
}
