/***
 * Computes the positions and dimensions of items that will be rendered by the list. The output from this is utilized by viewability tracker to compute the
 * lists of visible/hidden item.
 * Note: In future, this will also become an external dependency which means you can write your own layout manager. That will enable everyone to layout their
 * views just the way they want. Current implementation is a StaggeredList
 */
import LayoutProvider, { Dimension } from "../dependencies/LayoutProvider";
import { LayoutManagerInterface, Point, Rect } from "../dependencies/LayoutManagerInterface";
import CustomError from "../exceptions/CustomError";

export default class MasonaryLayoutManager implements LayoutManagerInterface {
  private _layoutProvider: LayoutProvider;
  private _window: Dimension;
  private _totalHeight: number;
  private _totalWidth: number;
  private _layouts: Rect[];
  private _isHorizontal: boolean;
  private _columnCount: number;

  constructor(
    columnCount: number,
    layoutProvider: LayoutProvider,
    dimensions: Dimension,
    isHorizontal: boolean = false,
    cachedLayouts?: Rect[],
  ) {
    this._columnCount = columnCount;
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

  public reLayoutFromIndex(startIndex: number, itemCount: number): void {
    // startIndex = this._locateFirstNeighbourIndex(startIndex);
    //TODO find a way to use start index
    startIndex = 0;

    let startX = 0;
    let startY = 0;

    const itemDim = { height: 0, width: 0 };

    const newLayouts = [];
    const columnLenghts: number[] = [];
    for (let idx = 0; idx < this._columnCount; idx++) {
      columnLenghts[idx] = 0;
    }
    const minColumnIdxFn = (cols: number[]) => cols.reduce((acc, val, idx, arr) => (val < arr[acc] ? idx : acc), 0);
    const colLenght = (this._isHorizontal ? this._window.height : this._window.width) / this._columnCount;
    for (let i = startIndex; i < itemCount; i++) {
      const oldLayout = this._layouts[i];
      if (oldLayout && oldLayout.isOverridden) {
        itemDim.height = oldLayout.height;
        itemDim.width = oldLayout.width;
      } else {
        this._layoutProvider.setLayoutForType(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
      }
      this.setMaxBounds(itemDim);

      const minColumnIdx = minColumnIdxFn(columnLenghts);
      startY = columnLenghts[minColumnIdx];
      startX = colLenght * minColumnIdx;

      newLayouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });

      if (this._isHorizontal) {
        columnLenghts[minColumnIdx] += itemDim.width;
        if (startY + colLenght <= this._window.height) {
          startY = startY + colLenght;
        } else {
          startY = 0;
        }
        startX = columnLenghts[minColumnIdxFn(columnLenghts)];
      } else {
        columnLenghts[minColumnIdx] += itemDim.height;
      }
    }
    this._layouts = newLayouts;

    const maxColumnIdxFn = () => columnLenghts.reduce((acc, val, idx, arr) => (arr[acc] > val ? acc : idx), 0);

    if (this._isHorizontal) {
      this._totalHeight = this._window.height;
      this._totalWidth = columnLenghts[maxColumnIdxFn()];
    } else {
      this._totalWidth = this._window.width;
      this._totalHeight = columnLenghts[maxColumnIdxFn()];
    }
  }

  private _checkBounds(itemX: number, itemY: number, itemDim: Dimension, isHorizontal: boolean): boolean {
    return isHorizontal ? itemY + itemDim.height <= this._window.height : itemX + itemDim.width <= this._window.width;
  }
}
