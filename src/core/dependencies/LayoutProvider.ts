import {
  Layout,
  WrapGridLayoutManager,
  LayoutManager,
  GridLayoutManager,
} from "../layoutmanager/LayoutManager";
import CustomError from "../exceptions/CustomError";

/**
 * Created by talha.naqvi on 05/04/17.
 * You can create a new instance or inherit and override default methods
 * You may need access to data provider here, it might make sense to pass a function which lets you fetch the latest data provider
 * Why only indexes? The answer is to allow data virtualization in the future. Since layouts are accessed much before the actual render assuming having all
 * data upfront will only limit possibilites in the future.
 *
 * By design LayoutProvider forces you to think in terms of view types. What that means is that you'll always be dealing with a finite set of view templates
 * with deterministic dimensions. We want to eliminate unnecessary re-layouts that happen when height, by mistake, is not taken into consideration.
 * This patters ensures that your scrolling is as smooth as it gets. You can always increase the number of types to handle non deterministic scenarios.
 *
 * NOTE: You can also implement features such as ListView/GridView switch by simple changing your layout provider.
 */

export abstract class BaseLayoutProvider {
  //Return your layout manager, you get all required dependencies here. Also, make sure to use cachedLayouts. RLV might cache layouts and give back to
  //in cases of conxtext preservation. Make sure you use them if provided.
  public abstract newLayoutManager(
    renderWindowSize: Dimension,
    isHorizontal?: boolean,
    cachedLayouts?: Layout[],
  ): LayoutManager;

  //Given an index a provider is expected to return a view type which used to recycling choices
  public abstract getLayoutTypeForIndex(index: number): string | number;

  //Check if given dimension contradicts with your layout provider, return true for mismatches. Returning true will
  //cause a relayout to fix the discrepancy
  public abstract checkDimensionDiscrepancy(
    dimension: Dimension,
    type: string | number,
    index: number,
  ): boolean;
}

export class LayoutProvider extends BaseLayoutProvider {
  private _setLayoutForType: (
    type: string | number,
    dim: Dimension,
    index: number,
  ) => void;
  private _getLayoutTypeForIndex: (index: number) => string | number;
  private _tempDim: Dimension;
  private _lastLayoutManager: WrapGridLayoutManager | undefined;

  constructor(
    getLayoutTypeForIndex: (index: number) => string | number,
    setLayoutForType: (
      type: string | number,
      dim: Dimension,
      index: number,
    ) => void,
  ) {
    super();
    this._getLayoutTypeForIndex = getLayoutTypeForIndex;
    this._setLayoutForType = setLayoutForType;
    this._tempDim = { height: 0, width: 0 };
  }

  public newLayoutManager(
    renderWindowSize: Dimension,
    isHorizontal?: boolean,
    cachedLayouts?: Layout[],
  ): LayoutManager {
    this._lastLayoutManager = new WrapGridLayoutManager(
      this,
      renderWindowSize,
      isHorizontal,
      cachedLayouts,
    );
    return this._lastLayoutManager;
  }

  //Provide a type for index, something which identifies the template of view about to load
  public getLayoutTypeForIndex(index: number): string | number {
    return this._getLayoutTypeForIndex(index);
  }

  //Given a type and dimension set the dimension values on given dimension object
  //You can also get index here if you add an extra argument but we don't recommend using it.
  public setComputedLayout(
    type: string | number,
    dimension: Dimension,
    index: number,
  ): void {
    return this._setLayoutForType(type, dimension, index);
  }

  public checkDimensionDiscrepancy(
    dimension: Dimension,
    type: string | number,
    index: number,
  ): boolean {
    const dimension1 = dimension;
    this.setComputedLayout(type, this._tempDim, index);
    const dimension2 = this._tempDim;
    if (this._lastLayoutManager) {
      this._lastLayoutManager.setMaxBounds(dimension2);
    }
    return (
      dimension1.height !== dimension2.height ||
      dimension1.width !== dimension2.width
    );
  }
}

export class GridLayoutProvider extends LayoutProvider {
  private _getDimensionForIndex: (index: number) => number;
  private _getSpanForIndex: (index: number) => number;
  private _setMaxSpan: () => number;
  private _renderWindowSize: Dimension | undefined;
  private _isHorizontal: boolean | undefined;
  constructor(
    getLayoutTypeForIndex: (index: number) => string | number,
    getDimensionForIndex: (index: number) => number,
    getSpanForIndex: (index: number) => number,
    setMaxSpan: () => number,
  ) {
    super(
      getLayoutTypeForIndex,
      (type: string | number, dimension: Dimension, index: number) => {
        this.setLayoutForTypeGrid(dimension, index);
      },
    );
    this._getDimensionForIndex = getDimensionForIndex;
    this._getSpanForIndex = getSpanForIndex;
    this._setMaxSpan = setMaxSpan;
  }

  public setLayoutForTypeGrid(dimension: Dimension, index: number): void {
    const maxSpan: number = this.setMaxSpan();
    const itemSpan: number = this.getSpanForIndex(index);
    if (itemSpan > maxSpan) {
      throw new CustomError({
        message: "Item span for index " + index + " is more than the max span",
        type: "SpanMismatchException",
      });
    }
    if (this._isHorizontal) {
      dimension.width = this.getDimensionForIndex(index);
      if (this._renderWindowSize) {
        dimension.height = (this._renderWindowSize.height / maxSpan) * itemSpan;
      }
    } else {
      dimension.height = this.getDimensionForIndex(index);
      if (this._renderWindowSize) {
        dimension.width = (this._renderWindowSize.width / maxSpan) * itemSpan;
      }
    }
  }

  public newLayoutManager(
    renderWindowSize: Dimension,
    isHorizontal?: boolean,
    cachedLayouts?: Layout[],
  ): LayoutManager {
    this._isHorizontal = isHorizontal;
    this._renderWindowSize = renderWindowSize;
    return new GridLayoutManager(
      this,
      renderWindowSize,
      this.getSpanForIndex,
      this.setMaxSpan,
      this._isHorizontal,
      cachedLayouts,
    );
  }

  public setMaxSpan(): number {
    return this._setMaxSpan();
  }

  public getSpanForIndex(index: number): number {
    return this._getSpanForIndex(index);
  }

  public getDimensionForIndex(index: number): number {
    return this._getDimensionForIndex(index);
  }
}

export interface Dimension {
  height: number;
  width: number;
}
