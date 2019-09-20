import { Dimension } from "./dependencies/LayoutProvider";
import { Layout } from "./layoutmanager/LayoutManager";
/***
 * Given an offset this utility can compute visible items. Also tracks previously visible items to compute items which get hidden or visible
 * Virtual renderer uses callbacks from this utility to main recycle pool and the render stack.
 * The utility optimizes finding visible indexes by using the last visible items. However, that can be slow if scrollToOffset is explicitly called.
 * We use binary search to optimize in most cases like while finding first visible item or initial offset. In future we'll also be using BS to speed up
 * scroll to offset.
 */
export interface Range {
    start: number;
    end: number;
}
export declare type TOnItemStatusChanged = ((all: number[], now: number[], notNow: number[]) => void);
export default class ViewabilityTracker {
    onVisibleRowsChanged: TOnItemStatusChanged | null;
    onEngagedRowsChanged: TOnItemStatusChanged | null;
    private _currentOffset;
    private _maxOffset;
    private _renderAheadOffset;
    private _visibleWindow;
    private _engagedWindow;
    private _relevantDim;
    private _isHorizontal;
    private _windowBound;
    private _visibleIndexes;
    private _engagedIndexes;
    private _layouts;
    private _actualOffset;
    constructor(renderAheadOffset: number, initialOffset: number);
    init(): void;
    setLayouts(layouts: Layout[], maxOffset: number): void;
    setDimensions(dimension: Dimension, isHorizontal: boolean): void;
    forceRefresh(): boolean;
    forceRefreshWithOffset(offset: number): void;
    updateOffset(offset: number, correction: number, isActual: boolean): void;
    getLastOffset(): number;
    getLastActualOffset(): number;
    getEngagedIndexes(): number[];
    findFirstLogicallyVisibleIndex(): number;
    updateRenderAheadOffset(renderAheadOffset: number): void;
    getCurrentRenderAheadOffset(): number;
    private _findFirstVisibleIndexOptimally;
    private _fitAndUpdate;
    private _doInitialFit;
    private _findFirstVisibleIndexLinearly;
    private _findFirstVisibleIndexUsingBS;
    private _valueExtractorForBinarySearch;
    private _fitIndexes;
    private _checkIntersectionAndReport;
    private _setRelevantBounds;
    private _isItemInBounds;
    private _isItemBoundsBeyondWindow;
    private _itemIntersectsWindow;
    private _itemIntersectsEngagedWindow;
    private _itemIntersectsVisibleWindow;
    private _updateTrackingWindows;
    private _diffUpdateOriginalIndexesAndRaiseEvents;
    private _diffArraysAndCallFunc;
    private _calculateArrayDiff;
}
