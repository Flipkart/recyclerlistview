"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RecycleItemPool_1 = require("../utils/RecycleItemPool");
var CustomError_1 = require("./exceptions/CustomError");
var RecyclerListViewExceptions_1 = require("./exceptions/RecyclerListViewExceptions");
var ViewabilityTracker_1 = require("./ViewabilityTracker");
var ts_object_utils_1 = require("ts-object-utils");
var TSCast_1 = require("../utils/TSCast");
var VirtualRenderer = /** @class */ (function () {
    function VirtualRenderer(renderStackChanged, scrollOnNextUpdate, fetchStableId, isRecyclingEnabled) {
        var _this = this;
        this._layoutProvider = TSCast_1.default.cast(null); //TSI
        this._recyclePool = TSCast_1.default.cast(null); //TSI
        this._layoutManager = null;
        this._viewabilityTracker = null;
        this._onVisibleItemsChanged = function (all, now, notNow) {
            if (_this.onVisibleItemsChanged) {
                _this.onVisibleItemsChanged(all, now, notNow);
            }
        };
        this._onEngagedItemsChanged = function (all, now, notNow) {
            var count = notNow.length;
            var resolvedKey;
            var disengagedIndex = 0;
            if (_this._isRecyclingEnabled) {
                for (var i = 0; i < count; i++) {
                    disengagedIndex = notNow[i];
                    delete _this._engagedIndexes[disengagedIndex];
                    if (_this._params && disengagedIndex < _this._params.itemCount) {
                        //All the items which are now not visible can go to the recycle pool, the pool only needs to maintain keys since
                        //react can link a view to a key automatically
                        resolvedKey = _this._stableIdToRenderKeyMap[_this._fetchStableId(disengagedIndex)];
                        if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(resolvedKey)) {
                            _this._recyclePool.putRecycledObject(_this._layoutProvider.getLayoutTypeForIndex(disengagedIndex), resolvedKey.key);
                        }
                    }
                }
            }
            if (_this._updateRenderStack(now)) {
                //Ask Recycler View to update itself
                _this._renderStackChanged(_this._renderStack);
            }
        };
        //Keeps track of items that need to be rendered in the next render cycle
        this._renderStack = {};
        this._fetchStableId = fetchStableId;
        //Keeps track of keys of all the currently rendered indexes, can eventually replace renderStack as well if no new use cases come up
        this._stableIdToRenderKeyMap = {};
        this._engagedIndexes = {};
        this._renderStackChanged = renderStackChanged;
        this._scrollOnNextUpdate = scrollOnNextUpdate;
        this._dimensions = null;
        this._params = null;
        this._isRecyclingEnabled = isRecyclingEnabled;
        this._isViewTrackerRunning = false;
        this._markDirty = false;
        //Would be surprised if someone exceeds this
        this._startKey = 0;
        this.onVisibleItemsChanged = null;
    }
    VirtualRenderer.prototype.getLayoutDimension = function () {
        if (this._layoutManager) {
            return this._layoutManager.getContentDimension();
        }
        return { height: 0, width: 0 };
    };
    VirtualRenderer.prototype.updateOffset = function (offsetX, offsetY, correction, isActual) {
        if (this._viewabilityTracker) {
            if (!this._isViewTrackerRunning) {
                this.startViewabilityTracker();
            }
            if (this._params && this._params.isHorizontal) {
                this._viewabilityTracker.updateOffset(offsetX, correction, isActual);
            }
            else {
                this._viewabilityTracker.updateOffset(offsetY, correction, isActual);
            }
        }
    };
    VirtualRenderer.prototype.attachVisibleItemsListener = function (callback) {
        this.onVisibleItemsChanged = callback;
    };
    VirtualRenderer.prototype.removeVisibleItemsListener = function () {
        this.onVisibleItemsChanged = null;
        if (this._viewabilityTracker) {
            this._viewabilityTracker.onVisibleRowsChanged = null;
        }
    };
    VirtualRenderer.prototype.getLayoutManager = function () {
        return this._layoutManager;
    };
    VirtualRenderer.prototype.setParamsAndDimensions = function (params, dim) {
        this._params = params;
        this._dimensions = dim;
    };
    VirtualRenderer.prototype.setLayoutManager = function (layoutManager) {
        this._layoutManager = layoutManager;
        if (this._params) {
            this._layoutManager.relayoutFromIndex(0, this._params.itemCount);
        }
    };
    VirtualRenderer.prototype.setLayoutProvider = function (layoutProvider) {
        this._layoutProvider = layoutProvider;
    };
    VirtualRenderer.prototype.getViewabilityTracker = function () {
        return this._viewabilityTracker;
    };
    VirtualRenderer.prototype.refreshWithAnchor = function () {
        if (this._viewabilityTracker) {
            var firstVisibleIndex = this._viewabilityTracker.findFirstLogicallyVisibleIndex();
            this._prepareViewabilityTracker();
            var offset = 0;
            if (this._layoutManager && this._params) {
                var point = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
                this._scrollOnNextUpdate(point);
                offset = this._params.isHorizontal ? point.x : point.y;
            }
            this._viewabilityTracker.forceRefreshWithOffset(offset);
        }
    };
    VirtualRenderer.prototype.refresh = function () {
        if (this._viewabilityTracker) {
            this._prepareViewabilityTracker();
            if (this._viewabilityTracker.forceRefresh()) {
                if (this._params && this._params.isHorizontal) {
                    this._scrollOnNextUpdate({ x: this._viewabilityTracker.getLastActualOffset(), y: 0 });
                }
                else {
                    this._scrollOnNextUpdate({ x: 0, y: this._viewabilityTracker.getLastActualOffset() });
                }
            }
        }
    };
    VirtualRenderer.prototype.getInitialOffset = function () {
        var offset = { x: 0, y: 0 };
        if (this._params) {
            var initialRenderIndex = ts_object_utils_1.Default.value(this._params.initialRenderIndex, 0);
            if (initialRenderIndex > 0 && this._layoutManager) {
                offset = this._layoutManager.getOffsetForIndex(initialRenderIndex);
                this._params.initialOffset = this._params.isHorizontal ? offset.x : offset.y;
            }
            else {
                if (this._params.isHorizontal) {
                    offset.x = ts_object_utils_1.Default.value(this._params.initialOffset, 0);
                    offset.y = 0;
                }
                else {
                    offset.y = ts_object_utils_1.Default.value(this._params.initialOffset, 0);
                    offset.x = 0;
                }
            }
        }
        return offset;
    };
    VirtualRenderer.prototype.init = function () {
        this.getInitialOffset();
        this._recyclePool = new RecycleItemPool_1.default();
        if (this._params) {
            this._viewabilityTracker = new ViewabilityTracker_1.default(ts_object_utils_1.Default.value(this._params.renderAheadOffset, 0), ts_object_utils_1.Default.value(this._params.initialOffset, 0));
        }
        else {
            this._viewabilityTracker = new ViewabilityTracker_1.default(0, 0);
        }
        this._prepareViewabilityTracker();
    };
    VirtualRenderer.prototype.startViewabilityTracker = function () {
        if (this._viewabilityTracker) {
            this._isViewTrackerRunning = true;
            this._viewabilityTracker.init();
        }
    };
    VirtualRenderer.prototype.syncAndGetKey = function (index, overrideStableIdProvider, newRenderStack) {
        var getStableId = overrideStableIdProvider ? overrideStableIdProvider : this._fetchStableId;
        var renderStack = newRenderStack ? newRenderStack : this._renderStack;
        var stableIdItem = this._stableIdToRenderKeyMap[getStableId(index)];
        var key = stableIdItem ? stableIdItem.key : undefined;
        if (ts_object_utils_1.ObjectUtil.isNullOrUndefined(key)) {
            var type = this._layoutProvider.getLayoutTypeForIndex(index);
            key = this._recyclePool.getRecycledObject(type);
            if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(key)) {
                var itemMeta = renderStack[key];
                if (itemMeta) {
                    var oldIndex = itemMeta.dataIndex;
                    itemMeta.dataIndex = index;
                    if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(oldIndex) && oldIndex !== index) {
                        delete this._stableIdToRenderKeyMap[getStableId(oldIndex)];
                    }
                }
                else {
                    renderStack[key] = { dataIndex: index };
                }
            }
            else {
                key = getStableId(index);
                if (renderStack[key]) {
                    //Probable collision, warn and avoid
                    //TODO: Disabled incorrectly triggering in some cases
                    //console.warn("Possible stableId collision @", index); //tslint:disable-line
                    key = this._getCollisionAvoidingKey();
                }
                renderStack[key] = { dataIndex: index };
            }
            this._markDirty = true;
            this._stableIdToRenderKeyMap[getStableId(index)] = { key: key, type: type };
        }
        if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(this._engagedIndexes[index])) {
            this._recyclePool.removeFromPool(key);
        }
        var stackItem = renderStack[key];
        if (stackItem && stackItem.dataIndex !== index) {
            //Probable collision, warn
            console.warn("Possible stableId collision @", index); //tslint:disable-line
        }
        return key;
    };
    //Further optimize in later revision, pretty fast for now considering this is a low frequency event
    VirtualRenderer.prototype.handleDataSetChange = function (newDataProvider, shouldOptimizeForAnimations) {
        var getStableId = newDataProvider.getStableId;
        var maxIndex = newDataProvider.getSize() - 1;
        var activeStableIds = {};
        var newRenderStack = {};
        //Compute active stable ids and stale active keys and resync render stack
        for (var key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                var index = this._renderStack[key].dataIndex;
                if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(index)) {
                    if (index <= maxIndex) {
                        var stableId = getStableId(index);
                        activeStableIds[stableId] = 1;
                    }
                }
            }
        }
        //Clean stable id to key map
        var oldActiveStableIds = Object.keys(this._stableIdToRenderKeyMap);
        var oldActiveStableIdsCount = oldActiveStableIds.length;
        for (var i = 0; i < oldActiveStableIdsCount; i++) {
            var key = oldActiveStableIds[i];
            if (!activeStableIds[key]) {
                if (!shouldOptimizeForAnimations && this._isRecyclingEnabled) {
                    var stableIdItem = this._stableIdToRenderKeyMap[key];
                    if (stableIdItem) {
                        this._recyclePool.putRecycledObject(stableIdItem.type, stableIdItem.key);
                    }
                }
                delete this._stableIdToRenderKeyMap[key];
            }
        }
        for (var key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                var index = this._renderStack[key].dataIndex;
                if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(index)) {
                    if (index <= maxIndex) {
                        var newKey = this.syncAndGetKey(index, getStableId, newRenderStack);
                        var newStackItem = newRenderStack[newKey];
                        if (!newStackItem) {
                            newRenderStack[newKey] = { dataIndex: index };
                        }
                        else if (newStackItem.dataIndex !== index) {
                            var cllKey = this._getCollisionAvoidingKey();
                            newRenderStack[cllKey] = { dataIndex: index };
                            this._stableIdToRenderKeyMap[getStableId(index)] = {
                                key: cllKey, type: this._layoutProvider.getLayoutTypeForIndex(index),
                            };
                        }
                    }
                }
                delete this._renderStack[key];
            }
        }
        Object.assign(this._renderStack, newRenderStack);
        for (var key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                var index = this._renderStack[key].dataIndex;
                if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(index) && ts_object_utils_1.ObjectUtil.isNullOrUndefined(this._engagedIndexes[index])) {
                    var type = this._layoutProvider.getLayoutTypeForIndex(index);
                    this._recyclePool.putRecycledObject(type, key);
                }
            }
        }
    };
    VirtualRenderer.prototype._getCollisionAvoidingKey = function () {
        return "#" + this._startKey++ + "_rlv_c";
    };
    VirtualRenderer.prototype._prepareViewabilityTracker = function () {
        if (this._viewabilityTracker && this._layoutManager && this._dimensions && this._params) {
            this._viewabilityTracker.onEngagedRowsChanged = this._onEngagedItemsChanged;
            if (this.onVisibleItemsChanged) {
                this._viewabilityTracker.onVisibleRowsChanged = this._onVisibleItemsChanged;
            }
            this._viewabilityTracker.setLayouts(this._layoutManager.getLayouts(), this._params.isHorizontal ?
                this._layoutManager.getContentDimension().width :
                this._layoutManager.getContentDimension().height);
            this._viewabilityTracker.setDimensions({
                height: this._dimensions.height,
                width: this._dimensions.width,
            }, ts_object_utils_1.Default.value(this._params.isHorizontal, false));
        }
        else {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.initializationException);
        }
    };
    //Updates render stack and reports whether anything has changed
    VirtualRenderer.prototype._updateRenderStack = function (itemIndexes) {
        this._markDirty = false;
        var count = itemIndexes.length;
        var index = 0;
        var hasRenderStackChanged = false;
        for (var i = 0; i < count; i++) {
            index = itemIndexes[i];
            this._engagedIndexes[index] = 1;
            this.syncAndGetKey(index);
            hasRenderStackChanged = this._markDirty;
        }
        this._markDirty = false;
        return hasRenderStackChanged;
    };
    return VirtualRenderer;
}());
exports.default = VirtualRenderer;
//# sourceMappingURL=VirtualRenderer.js.map