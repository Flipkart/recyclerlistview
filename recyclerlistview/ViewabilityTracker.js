import BinarySearch from "../utils/BinarySearch";
class ViewabilityTracker {
    constructor(renderAheadOffset, initialOffset) {
        this._layouts = null;
        this._currentOffset = Math.max(0, initialOffset);
        this._maxOffset = null;
        this._renderAheadOffset = renderAheadOffset;
        this._visibleWindow = {start: 0, end: 0};
        this._engagedWindow = {start: 0, end: 0};

        this._isHorizontal = false;
        this._windowBound = 0;

        this._visibleIndexes = [];  //needs to be sorted
        this._engagedIndexes = [];  //needs to be sorted

        this.onVisibleRowsChanged = null;
        this.onEngagedRowsChanged = null;

        this._relevantDim = {startBound: 0, endBound: 0};

        this._valueExtractorForBinarySearch = this._valueExtractorForBinarySearch.bind(this);
    }

    init() {
        this._doInitialFit(this._currentOffset);
    }

    setLayouts(layouts, maxOffset) {
        this._layouts = layouts;
        this._maxOffset = maxOffset;
    }

    setDimensions(dimensions, isHorizontal) {
        this._isHorizontal = isHorizontal;
        this._windowBound = isHorizontal ? dimensions.width : dimensions.height;
    }

    forceRefresh() {
        let shouldForceScroll = this._currentOffset >= (this._maxOffset - this._windowBound);
        this.forceRefreshWithOffset(this._currentOffset);
        return shouldForceScroll;
    }

    forceRefreshWithOffset(offset) {
        this._currentOffset = -1;
        this.updateOffset(offset);
    }

    updateOffset(offset) {
        offset = Math.min(this._maxOffset, Math.max(0, offset));
        if (this._currentOffset !== offset) {
            this._currentOffset = offset;
            this._updateTrackingWindows(offset);
            let startIndex = 0;
            if (this._visibleIndexes.length > 0) {
                startIndex = this._visibleIndexes[0];
            }
            this._fitAndUpdate(startIndex);
        }
    }

    getLastOffset() {
        return this._currentOffset;
    }

    findFirstLogicallyVisibleIndex() {
        let relevantIndex = this._findFirstVisibleIndexUsingBS(0.001);
        let result = relevantIndex;
        for (let i = relevantIndex - 1; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[relevantIndex].x !== this._layouts[i].x) {
                    break;
                }
                else {
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

    _findFirstVisibleIndexOptimally() {
        let firstVisibleIndex = 0;

        //TODO: Talha calculate this value smartly
        if (this._currentOffset > 5000) {
            firstVisibleIndex = this._findFirstVisibleIndexUsingBS();
        }
        else if (this._currentOffset > 0) {
            firstVisibleIndex = this._findFirstVisibleIndexLinearly();
        }
        return firstVisibleIndex;
    }

    _fitAndUpdate(startIndex) {
        let newVisibleItems = [];
        let newEngagedItems = [];
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex, true);
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex + 1, false);
        this._diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems, newEngagedItems);
    }

    _doInitialFit(offset) {
        offset = Math.min(this._maxOffset, Math.max(0, offset));
        this._updateTrackingWindows(offset);
        let firstVisibleIndex = this._findFirstVisibleIndexOptimally();
        this._fitAndUpdate(firstVisibleIndex);
    }

    //TODO:Talha switch to binary search and remove atleast once logic in _fitIndexes
    _findFirstVisibleIndexLinearly() {
        const count = this._layouts.length;
        let itemRect = null;
        let relevantDim = {startBound: 0, endBound: 0};

        for (let i = 0; i < count; i++) {
            itemRect = this._layouts[i];
            this._setRelevantBounds(itemRect, relevantDim);
            if (this._itemIntersectsVisibleWindow(relevantDim.startBound, relevantDim.endBound)) {
                return i;
            }
        }
    }

    _findFirstVisibleIndexUsingBS(bias = 0) {
        const count = this._layouts.length;
        return BinarySearch.findClosestHigherValueIndex(count, this._visibleWindow.start + bias, this._valueExtractorForBinarySearch);
    }

    _valueExtractorForBinarySearch(index) {
        let itemRect = this._layouts[index];
        this._setRelevantBounds(itemRect, this._relevantDim);
        return this._relevantDim.endBound;
    }

    //TODO:Talha Optimize further in later revisions, alteast once logic can be replace with a BS lookup
    _fitIndexes(newVisibleIndexes, newEngagedIndexes, startIndex, isReverse) {
        const count = this._layouts.length;
        let relevantDim = {startBound: 0, endBound: 0};
        let i = 0;
        let atLeastOneLocated = false;
        if (startIndex < count) {
            if (!isReverse) {
                for (i = startIndex; i < count; i++) {
                    if (this._checkIntersectionAndReport(i, false, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    }
                    else {
                        if (atLeastOneLocated) {
                            break;
                        }
                    }
                }
            }
            else {
                for (i = startIndex; i >= 0; i--) {
                    if (this._checkIntersectionAndReport(i, true, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    }
                    else {
                        if (atLeastOneLocated) {
                            break;
                        }
                    }
                }
            }
        }
    }

    _checkIntersectionAndReport(index, insertOnTop, relevantDim, newVisibleIndexes, newEngagedIndexes) {
        let itemRect = this._layouts[index];
        let isFound = false;
        this._setRelevantBounds(itemRect, relevantDim);
        if (this._itemIntersectsVisibleWindow(relevantDim.startBound, relevantDim.endBound)) {
            if (insertOnTop) {
                newVisibleIndexes.splice(0, 0, index);
                newEngagedIndexes.splice(0, 0, index);
            }
            else {
                newVisibleIndexes.push(index);
                newEngagedIndexes.push(index);
            }
            isFound = true;
        }
        else if (this._itemIntersectsEngagedWindow(relevantDim.startBound, relevantDim.endBound)) {
            if (insertOnTop) {
                newEngagedIndexes.splice(0, 0, index);
            }
            else {
                newEngagedIndexes.push(index);

            }
            isFound = true;
        }
        return isFound;
    }

    _setRelevantBounds(itemRect, relevantDim) {
        if (this._isHorizontal) {
            relevantDim.endBound = itemRect.x + itemRect.width;
            relevantDim.startBound = itemRect.x;
        }
        else {
            relevantDim.endBound = itemRect.y + itemRect.height;
            relevantDim.startBound = itemRect.y;
        }
    }

    _isItemInBounds(window, itemBound) {
        return (window.start <= itemBound && window.end >= itemBound);
    }

    _itemIntersectsWindow(window, startBound, endBound) {
        return this._isItemInBounds(window, startBound) || this._isItemInBounds(window, endBound);
    }

    _itemIntersectsEngagedWindow(startBound, endBound) {
        return this._itemIntersectsWindow(this._engagedWindow, startBound, endBound);
    }

    _itemIntersectsVisibleWindow(startBound, endBound) {
        return this._itemIntersectsWindow(this._visibleWindow, startBound, endBound);
    }

    _updateTrackingWindows(newOffset) {
        this._engagedWindow.start = Math.max(0, newOffset - this._renderAheadOffset);
        this._engagedWindow.end = newOffset + this._windowBound + this._renderAheadOffset;

        this._visibleWindow.start = newOffset;
        this._visibleWindow.end = newOffset + this._windowBound;
    }

    //TODO:Talha optimize this
    _diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems, newEngagedItems) {
        this._diffArraysAndCallFunc(newVisibleItems, this._visibleIndexes, this.onVisibleRowsChanged);
        this._diffArraysAndCallFunc(newEngagedItems, this._engagedIndexes, this.onEngagedRowsChanged);
        this._visibleIndexes = newVisibleItems;
        this._engagedIndexes = newEngagedItems;
    }

    _diffArraysAndCallFunc(newItems, oldItems, func) {
        if (func) {
            let now = this._calculateArrayDiff(newItems, oldItems);
            let notNow = this._calculateArrayDiff(oldItems, newItems);
            if (now.length > 0 || notNow.length > 0) {
                func([...newItems], now, notNow);
            }
        }
    }

    _calculateArrayDiff(arr1, arr2) {
        const len = arr1.length;
        let diffArr = [];
        for (let i = 0; i < len; i++) {
            if (BinarySearch.findIndexOf(arr2, arr1[i]) === -1) {
                diffArr.push(arr1[i]);
            }
        }
        return diffArr;
    }
}

export
default
ViewabilityTracker;