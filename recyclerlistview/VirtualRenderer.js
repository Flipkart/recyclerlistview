import ViewabilityTracker from "./ViewabilityTracker";
import LayoutManager from "./layoutmanager/LayoutManager";
import RecycleItemPool from "../utils/RecycleItemPool";
class VirtualRenderer {
    constructor(refreshFunc) {
        this._renderStack = [];
        this._usageMap = {};
        this.refresh = refreshFunc;
        this.props = null;
        this.dimensions = null;

        this.onVisibleItemsChanged = null;
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
    }

    updatePropsAndDimensions(props, dim) {
        this.props = props;
        this.dimensions = dim;
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

    getViewabilityTracker() {
        return this._viewabilityTracker;
    }

    init(props, dim) {
        this.updatePropsAndDimensions(props, dim);
        this._recyclePool = new RecycleItemPool();
        this._layoutManager = new LayoutManager(props.layoutProvider, {
            height: dim.height,
            width: dim.width
        }, props.isHorizontal);
        this._layoutManager.setTotalItemCount(props.dataProvider.getSize());
        this._layoutManager.relayout();
        this._viewabilityTracker = new ViewabilityTracker(this._layoutManager.getLayouts(),
            props.renderAheadOffset,
            props.initialOffset, props.isHorizontal ? this._layoutManager.getLayoutDimension().width :
                this._layoutManager.getLayoutDimension().height, {
                height: dim.height,
                width: dim.width
            }, props.isHorizontal);
        this._viewabilityTracker.onEngagedRowsChanged = this._onEngagedItemsChanged;
        if (this.onVisibleItemsChanged) {
            this._viewabilityTracker.onVisibleRowsChanged = this._onVisibleItemsChanged;
        }
        this._viewabilityTracker.init();
    }

    _onVisibleItemsChanged(all, now, notNow) {
        if (this.onVisibleItemsChanged) {
            this.onVisibleItemsChanged(all, now, notNow);
        }
    }

    _onEngagedItemsChanged(all, now, notNow) {
        let count = notNow.length;
        let resolvedIndex = 0;
        for (let i = 0; i < count; i++) {
            resolvedIndex = this._usageMap[notNow[i]];
            this._recyclePool.putRecycledObject(this.props.layoutProvider.getLayoutTypeForIndex(resolvedIndex), resolvedIndex);
        }
        this._updateRenderStack(now, notNow, this.props);
        this.refresh(this._renderStack);
    }

    _updateRenderStack(itemIndexes, notNowIndexes, props) {
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
            type = props.layoutProvider.getLayoutTypeForIndex(index);
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
            itemMeta.itemRect = this._layoutManager.getLayouts()[index];
            itemMeta.type = type;
        }
        //console.log(this._renderStack);
    }

    getLayoutDimension() {
        return this._layoutManager.getLayoutDimension();
    }

    updateOffset(offsetX, offsetY) {
        if (this.props.isHorizontal) {
            this._viewabilityTracker.updateOffset(offsetX);
        }
        else {
            this._viewabilityTracker.updateOffset(offsetY);
        }
    }
}
export default VirtualRenderer;