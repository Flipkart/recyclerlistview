import ViewabilityTracker from "./ViewabilityTracker";
import RecycleItemPool from "../utils/RecycleItemPool";
class VirtualRenderer {
    constructor(renderStackChanged, scrollOnNextUpdate) {
        this._renderStack = [];
        this._usageMap = {};
        this._renderStackChanged = renderStackChanged;
        this._scrollOnNextUpdate = scrollOnNextUpdate;
        this._dimensions = null;
        this._params = null;

        this.onVisibleItemsChanged = null;
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
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
        let firstVisibleIndex = this._viewabilityTracker.findFirstVisibleIndex();
        this._prepareViewabilityTracker();
        let offset = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
        this._scrollOnNextUpdate(offset);
        offset = this._params.isHorizontal ? offset.x : offset.y;
        this._viewabilityTracker.forceRefreshWithOffset(offset);
    }

    refresh() {
        this._prepareViewabilityTracker();
        this._viewabilityTracker.forceRefresh();
    }

    init() {
        this._recyclePool = new RecycleItemPool();
        this._viewabilityTracker = new ViewabilityTracker(this._params.renderAheadOffset, this._params.initialOffset);
        this._prepareViewabilityTracker();
        this._viewabilityTracker.init();
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
        console.log(all);
        let count = notNow.length;
        let resolvedIndex = 0;
        for (let i = 0; i < count; i++) {
            resolvedIndex = this._usageMap[notNow[i]];
            this._recyclePool.putRecycledObject(this._layoutProvider.getLayoutTypeForIndex(resolvedIndex), resolvedIndex);
        }
        this._updateRenderStack(now, notNow);
        this._renderStackChanged(this._renderStack);
    }

    _updateRenderStack(itemIndexes, notNowIndexes) {
        let type = null;
        let availableIndex = null;
        let itemMeta = null;
        let count = itemIndexes.length;
        let notNowCount = notNowIndexes.length;
        let renderStackCount = this._renderStack.length;
        let index = 0;
        let i = 0;

        for (i = 0; i < notNowCount; i++) {
            delete this._usageMap[notNowIndexes[i]];
        }
        for (i = 0; i < count; i++) {
            index = itemIndexes[i];
            type = this._layoutProvider.getLayoutTypeForIndex(index);
            availableIndex = this._recyclePool.getRecycledObject(type);
            if (availableIndex) {
                itemMeta = this._renderStack[availableIndex];
                itemMeta.key = availableIndex;
            }
            else {
                itemMeta = {};
                itemMeta.key = renderStackCount.toString();
                this._renderStack.push(itemMeta);
                renderStackCount++;
            }
            this._usageMap[index] = itemMeta.key;
            itemMeta.dataIndex = index;
        }
        //console.log(this._renderStack);
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
}

export
default
VirtualRenderer;