import BinarySearch from "../utils/BinarySearch";
import { Dimension } from "./dependencies/LayoutProvider";
import { Layout } from "./layoutmanager/LayoutManager";
import { ViewabilityConfig } from "./RecyclerListView";
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

export interface WindowCorrection {
    windowShift: number;
    startCorrection: number;
    endCorrection: number;
}

export type TOnItemStatusChanged = ((all: number[], now: number[], notNow: number[]) => void);

export default class ViewabilityTracker {
    public onVisibleRowsChanged: TOnItemStatusChanged | null;
    public onEngagedRowsChanged: TOnItemStatusChanged | null;

    private _currentOffset: number;
    private _maxOffset: number;
    private _renderAheadOffset: number;
    private _visibleWindow: Range;
    private _engagedWindow: Range;
    private _relevantDim: Range;
    private _isHorizontal: boolean;
    private _windowBound: number;
    private _visibleIndexes: number[];
    private _lastReportedVisibleIndexes: number[];
    private _engagedIndexes: number[];
    private _layouts: Layout[] = [];
    private _actualOffset: number;
    private _defaultCorrection: WindowCorrection;
    private _viewabilityConfig: ViewabilityConfig | undefined;
    private timers: Set<number> = new Set();

    constructor(renderAheadOffset: number, initialOffset: number, viewabilityConfig: ViewabilityConfig | undefined) {
        this._currentOffset = Math.max(0, initialOffset);
        this._maxOffset = 0;
        this._actualOffset = 0;
        this._renderAheadOffset = renderAheadOffset;
        this._visibleWindow = { start: 0, end: 0 };
        this._engagedWindow = { start: 0, end: 0 };

        this._isHorizontal = false;
        this._windowBound = 0;

        this._visibleIndexes = [];  //needs to be sorted
        this._engagedIndexes = [];  //needs to be sorted
        this._lastReportedVisibleIndexes = [];

        this.onVisibleRowsChanged = null;
        this.onEngagedRowsChanged = null;

        this._relevantDim = { start: 0, end: 0 };
        this._defaultCorrection = { startCorrection: 0, endCorrection: 0, windowShift: 0 };
        this._viewabilityConfig = viewabilityConfig;
    }

    public init(windowCorrection: WindowCorrection): void {
        this._doInitialFit(this._currentOffset, windowCorrection);
    }

    public setLayouts(layouts: Layout[], maxOffset: number): void {
        this._layouts = layouts;
        this._maxOffset = maxOffset;
    }

    public setDimensions(dimension: Dimension, isHorizontal: boolean): void {
        this._isHorizontal = isHorizontal;
        this._windowBound = isHorizontal ? dimension.width : dimension.height;
    }

    public forceRefresh(): boolean {
        const shouldForceScroll = this._actualOffset >= 0 && this._currentOffset >= (this._maxOffset - this._windowBound);
        this.forceRefreshWithOffset(this._currentOffset);
        return shouldForceScroll;
    }

    public forceRefreshWithOffset(offset: number): void {
        this._currentOffset = -1;
        this.updateOffset(offset, false, this._defaultCorrection);
    }

    public updateOffset(offset: number, isActual: boolean, windowCorrection: WindowCorrection): void {
        let correctedOffset = offset;
        if (isActual) {
            this._actualOffset = offset;
            correctedOffset = Math.min(this._maxOffset, Math.max(0,
                offset + (windowCorrection.windowShift + windowCorrection.startCorrection)));
        }

        if (this._currentOffset !== correctedOffset) {
            this._currentOffset = correctedOffset;
            this._updateTrackingWindows(offset, windowCorrection);
            let startIndex = 0;
            if (this._visibleIndexes.length > 0) {
                startIndex = this._visibleIndexes[0];
            }
            this._fitAndUpdate(startIndex);
        }
    }

    public getLastOffset(): number {
        return this._currentOffset;
    }

    public getLastActualOffset(): number {
        return this._actualOffset;
    }

    public getEngagedIndexes(): number[] {
        return this._engagedIndexes;
    }

    public findFirstLogicallyVisibleIndex(): number {
        const relevantIndex = this._findFirstVisibleIndexUsingBS(0.001);
        let result = relevantIndex;
        for (let i = relevantIndex - 1; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[relevantIndex].x !== this._layouts[i].x) {
                    break;
                } else {
                    result = i;
                }
            } else {
                if (this._layouts[relevantIndex].y !== this._layouts[i].y) {
                    break;
                } else {
                    result = i;
                }
            }
        }
        return result;
    }

    public updateRenderAheadOffset(renderAheadOffset: number): void {
        this._renderAheadOffset = Math.max(0, renderAheadOffset);
        this.forceRefreshWithOffset(this._currentOffset);
    }

    public getCurrentRenderAheadOffset(): number {
        return this._renderAheadOffset;
    }
    public setActualOffset(actualOffset: number): void {
       this._actualOffset = actualOffset;
    }

    public timerCleanup(): void {
        this.timers.forEach(clearTimeout);
        this.timers.clear();
    }

    private _findFirstVisibleIndexOptimally(): number {
        let firstVisibleIndex = 0;

        //TODO: Talha calculate this value smartly
        if (this._currentOffset > 5000) {
            firstVisibleIndex = this._findFirstVisibleIndexUsingBS();
        } else if (this._currentOffset > 0) {
            firstVisibleIndex = this._findFirstVisibleIndexLinearly();
        }
        return firstVisibleIndex;
    }

    private _fitAndUpdate(startIndex: number): void {
        const newVisibleItems: number[] = [];
        const newEngagedItems: number[] = [];
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex, true);
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex + 1, false);
        this._diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems, newEngagedItems);
    }

    private _doInitialFit(offset: number, windowCorrection: WindowCorrection): void {
        offset = Math.min(this._maxOffset, Math.max(0, offset));
        this._updateTrackingWindows(offset, windowCorrection);
        const firstVisibleIndex = this._findFirstVisibleIndexOptimally();
        this._fitAndUpdate(firstVisibleIndex);
    }

    //TODO:Talha switch to binary search and remove atleast once logic in _fitIndexes
    private _findFirstVisibleIndexLinearly(): number {
        const count = this._layouts.length;
        let itemRect = null;
        const relevantDim = { start: 0, end: 0 };

        for (let i = 0; i < count; i++) {
            itemRect = this._layouts[i];
            this._setRelevantBounds(itemRect, relevantDim);
            const minimumItemViewPercentage = this._viewabilityConfig && this._viewabilityConfig.minimumItemViewPercentage || undefined;
            if (this._itemIntersectsVisibleWindow(relevantDim.start, relevantDim.end, minimumItemViewPercentage)) {
                return i;
            }
        }
        return 0;
    }

    private _findFirstVisibleIndexUsingBS(bias = 0): number {
        const count = this._layouts.length;
        return BinarySearch.findClosestHigherValueIndex(count, this._visibleWindow.start + bias, this._valueExtractorForBinarySearch);
    }

    private _valueExtractorForBinarySearch = (index: number): number => {
        const itemRect = this._layouts[index];
        this._setRelevantBounds(itemRect, this._relevantDim);
        return this._relevantDim.end;
    }

    //TODO:Talha Optimize further in later revisions, alteast once logic can be replace with a BS lookup
    private _fitIndexes(newVisibleIndexes: number[], newEngagedIndexes: number[], startIndex: number, isReverse: boolean): void {
        const count = this._layouts.length;
        const relevantDim: Range = { start: 0, end: 0 };
        let i = 0;
        let atLeastOneLocated = false;
        if (startIndex < count) {
            if (!isReverse) {
                for (i = startIndex; i < count; i++) {
                    if (this._checkIntersectionAndReport(i, false, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    } else {
                        if (atLeastOneLocated) {
                            break;
                        }
                    }
                }
            } else {
                for (i = startIndex; i >= 0; i--) {
                    if (this._checkIntersectionAndReport(i, true, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    } else {
                        if (atLeastOneLocated) {
                            break;
                        }
                    }
                }
            }
        }
    }

    private _checkIntersectionAndReport(index: number,
                                        insertOnTop: boolean,
                                        relevantDim: Range,
                                        newVisibleIndexes: number[],
                                        newEngagedIndexes: number[]): boolean {
        const itemRect = this._layouts[index];
        let isFound = false;
        this._setRelevantBounds(itemRect, relevantDim);
        const mininumViewPercentage = this._viewabilityConfig && this._viewabilityConfig.minimumItemViewPercentage || undefined;
        if (this._itemIntersectsVisibleWindow(relevantDim.start, relevantDim.end, mininumViewPercentage)) {
            if (insertOnTop) {
                newVisibleIndexes.splice(0, 0, index);
                newEngagedIndexes.splice(0, 0, index);
            } else {
                newVisibleIndexes.push(index);
                newEngagedIndexes.push(index);
            }
            isFound = true;
        } else if (this._itemIntersectsEngagedWindow(relevantDim.start, relevantDim.end)) {
            //TODO: This needs to be optimized
            if (insertOnTop) {
                newEngagedIndexes.splice(0, 0, index);
            } else {
                newEngagedIndexes.push(index);

            }
            isFound = true;
        }
        return isFound;
    }

    private _setRelevantBounds(itemRect: Layout, relevantDim: Range): void {
        if (this._isHorizontal) {
            relevantDim.end = itemRect.x + itemRect.width;
            relevantDim.start = itemRect.x;
        } else {
            relevantDim.end = itemRect.y + itemRect.height;
            relevantDim.start = itemRect.y;
        }
    }

    private _isItemInBounds(window: Range, itemBound: number): boolean {
        return (window.start < itemBound && window.end > itemBound);
    }

    private _isItemBoundsBeyondWindow(window: Range, startBound: number, endBound: number): boolean {
        return (window.start >= startBound && window.end <= endBound);
    }

    private _isZeroHeightEdgeElement(window: Range, startBound: number, endBound: number): boolean {
        return startBound - endBound === 0 && (window.start === startBound || window.end === endBound);
    }

    private _itemIntersectsWindow(window: Range, startBound: number, endBound: number): boolean {
        return this._isItemInBounds(window, startBound) ||
            this._isItemInBounds(window, endBound) ||
            this._isItemBoundsBeyondWindow(window, startBound, endBound) ||
            this._isZeroHeightEdgeElement(window, startBound, endBound);
    }

    private _itemIntersectsEngagedWindow(startBound: number, endBound: number): boolean {
        return this._itemIntersectsWindow(this._engagedWindow, startBound, endBound);
    }

    private _isItemInVisibleBounds(window: Range, itemStartBound: number, itemEndBound: number, mininumViewPercentage: number | undefined): boolean {
        let visibleItemContent = 0;
        const itemSize =  itemEndBound - itemStartBound;

        if (window.start >= itemStartBound && window.end >= itemEndBound) {
            visibleItemContent = itemEndBound - window.start;
        } else if (window.start <= itemStartBound && window.end <= itemEndBound) {
            visibleItemContent = window.end - itemStartBound;
        } else if (window.start <= itemStartBound && window.end >= itemEndBound) {
            visibleItemContent = itemEndBound - itemStartBound;
        } else if (window.start >= itemStartBound && window.end <= itemEndBound) {
            return true;
        } else {
            return false;
        }

        const isVisible = mininumViewPercentage
            ? visibleItemContent / itemSize * 100 >= mininumViewPercentage
            : visibleItemContent > 0;
        return isVisible;
    }

    private _itemIntersectsVisibleWindow(startBound: number, endBound: number, mininumViewPercentage?: number): boolean {
        return this._isItemInVisibleBounds(this._visibleWindow, startBound, endBound, mininumViewPercentage) ||
            this._isZeroHeightEdgeElement(this._visibleWindow, startBound, endBound);
    }

    private _updateTrackingWindows(offset: number, correction: WindowCorrection): void {
        const startCorrection = correction.windowShift + correction.startCorrection;
        const bottomCorrection = correction.windowShift + correction.endCorrection;

        const startOffset = offset + startCorrection;
        const endOffset = (offset + this._windowBound) + bottomCorrection;

        this._engagedWindow.start = Math.max(0, startOffset - this._renderAheadOffset);
        this._engagedWindow.end = endOffset + this._renderAheadOffset;

        this._visibleWindow.start = startOffset;
        this._visibleWindow.end = endOffset;
    }

    //TODO:Talha optimize this
    private _diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems: number[], newEngagedItems: number[]): void {
        const minimumViewTime = this._viewabilityConfig && this._viewabilityConfig.minimumViewTime
        ? this._viewabilityConfig.minimumViewTime
        : 0;
        this._diffArraysAndCallFunc(newVisibleItems, this._visibleIndexes, this.onVisibleRowsChanged, minimumViewTime);
        this._diffArraysAndCallFunc(newEngagedItems, this._engagedIndexes, this.onEngagedRowsChanged);
        this._visibleIndexes = newVisibleItems;
        this._engagedIndexes = newEngagedItems;
    }

    private checkMinimumViewTime = (all: number[], now: number[], notNow: number[], minimumViewTime: number, callbackFunc: TOnItemStatusChanged): void => {
        const that = this;
        const timeoutId = setTimeout(() => {
            that.timers.delete(timeoutId);

            const currAll = all.filter((index) => that._visibleIndexes.indexOf(index) >= 0);
            const currNow = currAll.filter((index) => that._lastReportedVisibleIndexes.indexOf(index) === -1);
            const currNotNow = that._lastReportedVisibleIndexes.filter((index) => currAll.indexOf(index) === -1);
            
            if (currAll.length > 0 && (currNow.length > 0 || currNotNow.length > 0)) {
                that._lastReportedVisibleIndexes = currAll;
                callbackFunc(currAll, currNow, currNotNow);
            }
        }, minimumViewTime);
        this.timers.add(timeoutId);
    }

    private _diffArraysAndCallFunc(newItems: number[], oldItems: number[], func: TOnItemStatusChanged | null, minimumViewTime?: number): void {
        if (func) {
            const now = this._calculateArrayDiff(newItems, oldItems);
            const notNow = this._calculateArrayDiff(oldItems, newItems);
            if (now.length > 0 || notNow.length > 0) {
                if (minimumViewTime && minimumViewTime > 0) { // TODO : should we set a minimum min view time check ? minimumViewTime > 500ms
                    this.checkMinimumViewTime([...newItems], now, notNow, minimumViewTime, func);
                } else {
                    func([...newItems], now, notNow);
                }
            }
        }
    }

    //TODO:Talha since arrays are sorted this can be much faster
    private _calculateArrayDiff(arr1: number[], arr2: number[]): number[] {
        const len = arr1.length;
        const diffArr = [];
        for (let i = 0; i < len; i++) {
            if (BinarySearch.findIndexOf(arr2, arr1[i]) === -1) {
                diffArr.push(arr1[i]);
            }
        }
        return diffArr;
    }
}
