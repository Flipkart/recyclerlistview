import RecycleItemPool from "../utils/RecycleItemPool";
import { Dimension, BaseLayoutProvider } from "./dependencies/LayoutProvider";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import { Point, LayoutManager } from "./layoutmanager/LayoutManager";
import ViewabilityTracker, { TOnItemStatusChanged } from "./ViewabilityTracker";
import { ObjectUtil, Default } from "ts-object-utils";
import TSCast from "../utils/TSCast";
import DataProvider from "./dependencies/DataProvider";

/***
 * Renderer which keeps track of recyclable items and the currently rendered items. Notifies list view to re render if something changes, like scroll offset
 */
export interface RenderStackItem {
    dataIndex?: number;
}
export interface StableIdMapItem {
    key: string;
    type: string | number;
}
export interface RenderStack { [key: string]: RenderStackItem; }

export interface RenderStackParams {
    isHorizontal?: boolean;
    itemCount: number;
    initialOffset?: number;
    initialRenderIndex?: number;
    renderAheadOffset?: number;
}

export type StableIdProvider = (index: number) => string;

export default class VirtualRenderer {

    public onVisibleItemsChanged: TOnItemStatusChanged | null;

    private _scrollOnNextUpdate: (point: Point) => void;
    private _stableIdToRenderKeyMap: { [key: string]: StableIdMapItem | undefined };
    private _engagedIndexes: { [key: number]: number | undefined };
    private _renderStack: RenderStack;
    private _renderStackChanged: (renderStack: RenderStack) => void;
    private _fetchStableId: StableIdProvider;
    private _isRecyclingEnabled: boolean;
    private _isViewTrackerRunning: boolean;
    private _markDirty: boolean;
    private _startKey: number;
    private _layoutProvider: BaseLayoutProvider = TSCast.cast<BaseLayoutProvider>(null); //TSI
    private _recyclePool: RecycleItemPool = TSCast.cast<RecycleItemPool>(null); //TSI

    private _params: RenderStackParams | null;
    private _layoutManager: LayoutManager | null = null;
    private _viewabilityTracker: ViewabilityTracker | null = null;
    private _dimensions: Dimension | null;

    constructor(renderStackChanged: (renderStack: RenderStack) => void,
                scrollOnNextUpdate: (point: Point) => void,
                fetchStableId: StableIdProvider,
                isRecyclingEnabled: boolean) {
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
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
    }

    public getLayoutDimension(): Dimension {
        if (this._layoutManager) {
            return this._layoutManager.getContentDimension();
        }
        return { height: 0, width: 0 };
    }

    public updateOffset(offsetX: number, offsetY: number): void {
        if (this._viewabilityTracker) {
            if (!this._isViewTrackerRunning) {
                this.startViewabilityTracker();
            }
            if (this._params && this._params.isHorizontal) {
                this._viewabilityTracker.updateOffset(offsetX);
            } else {
                this._viewabilityTracker.updateOffset(offsetY);
            }
        }
    }

    public attachVisibleItemsListener(callback: TOnItemStatusChanged): void {
        this.onVisibleItemsChanged = callback;
    }

    public removeVisibleItemsListener(): void {
        this.onVisibleItemsChanged = null;

        if (this._viewabilityTracker) {
            this._viewabilityTracker.onVisibleRowsChanged = null;
        }
    }

    public getLayoutManager(): LayoutManager | null {
        return this._layoutManager;
    }

    public setParamsAndDimensions(params: RenderStackParams, dim: Dimension): void {
        this._params = params;
        this._dimensions = dim;
    }

    public setLayoutManager(layoutManager: LayoutManager): void {
        this._layoutManager = layoutManager;
        if (this._params) {
            this._layoutManager.relayoutFromIndex(0, this._params.itemCount);
        }
    }

    public setLayoutProvider(layoutProvider: BaseLayoutProvider): void {
        this._layoutProvider = layoutProvider;
    }

    public getViewabilityTracker(): ViewabilityTracker | null {
        return this._viewabilityTracker;
    }

    public refreshWithAnchor(): void {
        if (this._viewabilityTracker) {
            const firstVisibleIndex = this._viewabilityTracker.findFirstLogicallyVisibleIndex();
            this._prepareViewabilityTracker();
            let offset = 0;
            if (this._layoutManager && this._params) {
                const point = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
                this._scrollOnNextUpdate(point);
                offset = this._params.isHorizontal ? point.x : point.y;
            }
            this._viewabilityTracker.forceRefreshWithOffset(offset);
        }
    }

    public refresh(): void {
        if (this._viewabilityTracker) {
            this._prepareViewabilityTracker();
            if (this._viewabilityTracker.forceRefresh()) {
                if (this._params && this._params.isHorizontal) {
                    this._scrollOnNextUpdate({ x: this._viewabilityTracker.getLastOffset(), y: 0 });
                } else {
                    this._scrollOnNextUpdate({ x: 0, y: this._viewabilityTracker.getLastOffset() });
                }
            }
        }
    }

    public getInitialOffset(): Point {
        let offset = { x: 0, y: 0 };
        if (this._params) {
            const initialRenderIndex = Default.value<number>(this._params.initialRenderIndex, 0);
            if (initialRenderIndex > 0 && this._layoutManager) {
                offset = this._layoutManager.getOffsetForIndex(initialRenderIndex);
                this._params.initialOffset = this._params.isHorizontal ? offset.x : offset.y;
            } else {
                if (this._params.isHorizontal) {
                    offset.x = Default.value<number>(this._params.initialOffset, 0);
                    offset.y = 0;
                } else {
                    offset.y = Default.value<number>(this._params.initialOffset, 0);
                    offset.x = 0;
                }
            }
        }
        return offset;
    }

    public init(): void {
        this.getInitialOffset();
        this._recyclePool = new RecycleItemPool();
        if (this._params) {
            this._viewabilityTracker = new ViewabilityTracker(
                Default.value<number>(this._params.renderAheadOffset, 0),
                Default.value<number>(this._params.initialOffset, 0));
        } else {
            this._viewabilityTracker = new ViewabilityTracker(0, 0);
        }
        this._prepareViewabilityTracker();
    }

    public startViewabilityTracker(): void {
        if (this._viewabilityTracker) {
            this._isViewTrackerRunning = true;
            this._viewabilityTracker.init();
        }
    }

    public syncAndGetKey(index: number, overrideStableIdProvider?: StableIdProvider, newRenderStack?: RenderStack): string {
        const getStableId = overrideStableIdProvider ? overrideStableIdProvider : this._fetchStableId;
        const renderStack = newRenderStack ? newRenderStack : this._renderStack;
        const stableIdItem = this._stableIdToRenderKeyMap[getStableId(index)];
        let key = stableIdItem ? stableIdItem.key : undefined;

        if (ObjectUtil.isNullOrUndefined(key)) {
            const type = this._layoutProvider.getLayoutTypeForIndex(index);
            key = this._recyclePool.getRecycledObject(type);
            if (!ObjectUtil.isNullOrUndefined(key)) {
                const itemMeta = renderStack[key];
                if (itemMeta) {
                    const oldIndex = itemMeta.dataIndex;
                    itemMeta.dataIndex = index;
                    if (!ObjectUtil.isNullOrUndefined(oldIndex) && oldIndex !== index) {
                        delete this._stableIdToRenderKeyMap[getStableId(oldIndex)];
                    }
                } else {
                    renderStack[key] = { dataIndex: index };
                }
            } else {
                key = getStableId(index);
                if (renderStack[key]) {
                    //Probable collision, warn and avoid
                    console.warn("Possible stableId collision @", index); //tslint:disable-line
                    key = this._getCollisionAvoidingKey();
                }
                renderStack[key] = { dataIndex: index };
            }
            this._markDirty = true;
            this._stableIdToRenderKeyMap[getStableId(index)] = { key, type };
        }
        if (!ObjectUtil.isNullOrUndefined(this._engagedIndexes[index])) {
            this._recyclePool.removeFromPool(key);
        }
        const stackItem = renderStack[key];
        if (stackItem && stackItem.dataIndex !== index) {
            //Probable collision, warn
            console.warn("Possible stableId collision @", index); //tslint:disable-line
        }
        return key;
    }

    //Further optimize in later revision, pretty fast for now considering this is a low frequency event
    public handleDataSetChange(newDataProvider: DataProvider, shouldOptimizeForAnimations?: boolean): void {
        const getStableId = newDataProvider.getStableId;
        const maxIndex = newDataProvider.getSize() - 1;
        const activeStableIds: { [key: string]: number } = {};
        const newRenderStack: RenderStack = {};

        //Compute active stable ids and stale active keys and resync render stack
        for (const key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                const index = this._renderStack[key].dataIndex;
                if (!ObjectUtil.isNullOrUndefined(index)) {
                    if (index <= maxIndex) {
                        const stableId = getStableId(index);
                        activeStableIds[stableId] = 1;
                    }
                }
            }
        }

        //Clean stable id to key map
        const oldActiveStableIds = Object.keys(this._stableIdToRenderKeyMap);
        const oldActiveStableIdsCount = oldActiveStableIds.length;
        for (let i = 0; i < oldActiveStableIdsCount; i++) {
            const key = oldActiveStableIds[i];
            if (!activeStableIds[key]) {
                if (!shouldOptimizeForAnimations && this._isRecyclingEnabled) {
                    const stableIdItem = this._stableIdToRenderKeyMap[key];
                    if (stableIdItem) {
                        this._recyclePool.putRecycledObject(stableIdItem.type, stableIdItem.key);
                    }
                }
                delete this._stableIdToRenderKeyMap[key];
            }
        }

        for (const key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                const index = this._renderStack[key].dataIndex;
                if (!ObjectUtil.isNullOrUndefined(index)) {
                    if (index <= maxIndex) {
                        const newKey = this.syncAndGetKey(index, getStableId, newRenderStack);
                        const newStackItem = newRenderStack[newKey];
                        if (!newStackItem) {
                            newRenderStack[newKey] = { dataIndex: index };
                        } else if (newStackItem.dataIndex !== index) {
                            const cllKey = this._getCollisionAvoidingKey();
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

        for (const key in this._renderStack) {
            if (this._renderStack.hasOwnProperty(key)) {
                const index = this._renderStack[key].dataIndex;
                if (!ObjectUtil.isNullOrUndefined(index) && ObjectUtil.isNullOrUndefined(this._engagedIndexes[index])) {
                    const type = this._layoutProvider.getLayoutTypeForIndex(index);
                    this._recyclePool.putRecycledObject(type, key);
                }
            }
        }
    }

    private _getCollisionAvoidingKey(): string {
        return "#" + this._startKey++ + "_rlv_c";
    }

    private _prepareViewabilityTracker(): void {
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
            }, Default.value<boolean>(this._params.isHorizontal, false));
        } else {
            throw new CustomError(RecyclerListViewExceptions.initializationException);
        }
    }

    private _onVisibleItemsChanged(all: number[], now: number[], notNow: number[]): void {
        if (this.onVisibleItemsChanged) {
            this.onVisibleItemsChanged(all, now, notNow);
        }
    }

    private _onEngagedItemsChanged(all: number[], now: number[], notNow: number[]): void {
        const count = notNow.length;
        let resolvedKey;
        let disengagedIndex = 0;
        if (this._isRecyclingEnabled) {
            for (let i = 0; i < count; i++) {
                disengagedIndex = notNow[i];
                delete this._engagedIndexes[disengagedIndex];
                if (this._params && disengagedIndex < this._params.itemCount) {
                    //All the items which are now not visible can go to the recycle pool, the pool only needs to maintain keys since
                    //react can link a view to a key automatically
                    resolvedKey = this._stableIdToRenderKeyMap[this._fetchStableId(disengagedIndex)];
                    if (!ObjectUtil.isNullOrUndefined(resolvedKey)) {
                        this._recyclePool.putRecycledObject(this._layoutProvider.getLayoutTypeForIndex(disengagedIndex), resolvedKey.key);
                    }
                }
            }
        }
        if (this._updateRenderStack(now)) {
            //Ask Recycler View to update itself
            this._renderStackChanged(this._renderStack);
        }
    }

    //Updates render stack and reports whether anything has changed
    private _updateRenderStack(itemIndexes: number[]): boolean {
        this._markDirty = false;
        const count = itemIndexes.length;
        let index = 0;
        let hasRenderStackChanged = false;
        for (let i = 0; i < count; i++) {
            index = itemIndexes[i];
            this._engagedIndexes[index] = 1;
            this.syncAndGetKey(index);
            hasRenderStackChanged = this._markDirty;
        }
        this._markDirty = false;
        return hasRenderStackChanged;
    }
}
