import ViewabilityTracker from "./ViewabilityTracker";
import RecycleItemPool from "../utils/RecycleItemPool";
class VirtualRenderer {
    constructor(renderStackChanged, scrollOnNextUpdate) {
        this._renderStack = {};
        this._usageMap = {};
        this._renderStackIndexKeyMap = {};
        this._renderStackChanged = renderStackChanged;
        this._scrollOnNextUpdate = scrollOnNextUpdate;
        this._dimensions = null;
        this._params = null;

        //Would be surprised if someone exceeds this
        this._startKey = 0;

        this.onVisibleItemsChanged = null;
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
    }

    getLayoutDimension() {
        return this._layoutManager.getLayoutDimension();
    }

    updateOffset(offsetX, offsetY) {
        if (this._params.isHorizontal) {
            this._viewabilityTracker.updateOffset(offsetX);
        }
        else {
            this._viewabilityTracker.updateOffset(offsetY);
        }
    }

    attachVisibleItemsListener(callback) {
        this.onVisibleItemsChanged = callback;
    }

    removeVisibleItemsListener() {
        this.onVisibleItemsChanged = null;
        this._viewabilityTracker.onVisibleRowsChanged = null;
    }

    getLayoutManager() {
        return this._layoutManager;
    }

    setParamsAndDimensions(params, dim) {
        this._params = params;
        this._dimensions = dim;
    }

    setLayoutManager(layoutManager) {
        this._layoutManager = layoutManager;
        this._layoutManager.reLayoutFromIndex(0, this._params.itemCount);
    }

    setLayoutProvider(layoutProvider) {
        this._layoutProvider = layoutProvider;
    }

    getViewabilityTracker() {
        return this._viewabilityTracker;
    }

    refreshWithAnchor() {
        let firstVisibleIndex = this._viewabilityTracker.findFirstLogicallyVisibleIndex();
        this._prepareViewabilityTracker();
        let offset = 0;
        try {
            offset = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
            this._scrollOnNextUpdate(offset);
            offset = this._params.isHorizontal ? offset.x : offset.y;
        } catch (e) {
        }
        this._viewabilityTracker.forceRefreshWithOffset(offset);
    }

    refresh() {
        this._prepareViewabilityTracker();
        if (this._viewabilityTracker.forceRefresh()) {
            if (this._params.isHorizontal) {
                this._scrollOnNextUpdate({x: this._viewabilityTracker.getLastOffset(), y: 0});
            }
            else {
                this._scrollOnNextUpdate({x: 0, y: this._viewabilityTracker.getLastOffset()});
            }
        }
    }

    init() {
        this._recyclePool = new RecycleItemPool();
        let offset;
        if (this._params.initialRenderIndex > 0) {
            offset = this._layoutManager.getOffsetForIndex(this._params.initialRenderIndex);
            this._params.initialOffset = this._params.isHorizontal ? offset.x : offset.y;
        }
        else {
            offset = {};
            if (this._params.isHorizontal) {
                offset.x = this._params.initialOffset;
                offset.y = 0;
            }
            else {
                offset.y = this._params.initialOffset;
                offset.x = 0;
            }
        }
        this._viewabilityTracker = new ViewabilityTracker(this._params.renderAheadOffset, this._params.initialOffset);
        this._prepareViewabilityTracker();
        this._viewabilityTracker.init();
        this._scrollOnNextUpdate(offset);
    }

    _getNewKey() {
        return this._startKey++;
    }

    _prepareViewabilityTracker() {
        this._viewabilityTracker.onEngagedRowsChanged = this._onEngagedItemsChanged;
        if (this.onVisibleItemsChanged) {
            this._viewabilityTracker.onVisibleRowsChanged = this._onVisibleItemsChanged;
        }
        this._viewabilityTracker.setLayouts(this._layoutManager.getLayouts(), this._params.isHorizontal ?
            this._layoutManager.getLayoutDimension().width :
            this._layoutManager.getLayoutDimension().height);
        this._viewabilityTracker.setDimensions({
            height: this._dimensions.height,
            width: this._dimensions.width
        }, this._params.isHorizontal);
    }

    _onVisibleItemsChanged(all, now, notNow) {
        if (this.onVisibleItemsChanged) {
            this.onVisibleItemsChanged(all, now, notNow);
        }
    }

    _onEngagedItemsChanged(all, now, notNow) {
        const count = notNow.length;
        let resolvedIndex = 0;
        let disengagedIndex = 0
        for (let i = 0; i < count; i++) {
            disengagedIndex = notNow[i];
            resolvedIndex = this._usageMap[disengagedIndex];
            delete this._usageMap[disengagedIndex];
            this._recyclePool.putRecycledObject(this._layoutProvider.getLayoutTypeForIndex(disengagedIndex), resolvedIndex);
        }
        this._updateRenderStack(now);
        this._renderStackChanged(this._renderStack);
    }

    _updateRenderStack(itemIndexes) {
        const count = itemIndexes.length;
        let type = null;
        let availableKey = null;
        let itemMeta = null;
        let index = 0;
        let alreadyRenderedAtKey = null;
        for (let i = 0; i < count; i++) {
            index = itemIndexes[i];
            availableKey = this._renderStackIndexKeyMap[index];
            if (availableKey >= 0) {
                this._recyclePool.removeFromPool(availableKey);
                itemMeta = this._renderStack[availableKey];
                itemMeta.key = availableKey;
            }
            else {
                type = this._layoutProvider.getLayoutTypeForIndex(index);
                availableKey = this._recyclePool.getRecycledObject(type);
                if (availableKey) {
                    //Recylepool works with string types so we need this conversion
                    availableKey = parseInt(availableKey, 10);
                    itemMeta = this._renderStack[availableKey];
                    itemMeta.key = availableKey;

                    //since this data index is no longer being rendered anywhere
                    delete this._renderStackIndexKeyMap[itemMeta.dataIndex];
                }
                else {
                    itemMeta = {};
                    availableKey = this._getNewKey();
                    itemMeta.key = availableKey;
                    this._renderStack[availableKey] = itemMeta;
                }

                //In case of mismatch in pool types we need to make sure only unique data indexes exist in render stack
                //keys are always integers for all practical purposes
                alreadyRenderedAtKey = this._renderStackIndexKeyMap[index];
                if (alreadyRenderedAtKey >= 0) {
                    this._recyclePool.removeFromPool(alreadyRenderedAtKey);
                    delete this._renderStack[alreadyRenderedAtKey];
                }
                this._renderStackIndexKeyMap[index] = itemMeta.key;
            }
            this._usageMap[index] = itemMeta.key;
            itemMeta.dataIndex = index;
        }
        //console.log(this._renderStack);
    }
}

export
default
VirtualRenderer;