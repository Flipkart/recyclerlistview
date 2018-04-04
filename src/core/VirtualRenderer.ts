import RecycleItemPool from "../utils/RecycleItemPool";
import { default as LayoutProvider, Dimension } from "./dependencies/LayoutProvider";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import LayoutManager, { Point } from "./layoutmanager/LayoutManager";
import ViewabilityTracker, { TOnItemStatusChanged } from "./ViewabilityTracker";
import { ObjectUtil, Default } from "ts-object-utils";
import TSCast from "../utils/TSCast";

/***
 * Renderer which keeps track of recyclable items and the currently rendered items. Notifies list view to re render if something changes, like scroll offset
 */
export interface RenderStackItem {
    key?: number;
    type?: string | number;
    dataIndex?: number;
}
export interface RenderStack { [key: string]: RenderStackItem; }

export interface RenderStackParams {
    isHorizontal?: boolean;
    itemCount: number;
    initialOffset?: number;
    initialRenderIndex?: number;
    renderAheadOffset?: number;
}

export default class VirtualRenderer {

    public onVisibleItemsChanged: TOnItemStatusChanged | null;

    private _scrollOnNextUpdate: (point: Point) => void;
    private _renderStackIndexKeyMap: { [key: number]: number };
    private _renderStack: RenderStack;
    private _renderStackChanged: (renderStack: RenderStack) => void;
    private _isRecyclingEnabled: boolean;
    private _isViewTrackerRunning: boolean;
    private _startKey: number;
    private _layoutProvider: LayoutProvider = TSCast.cast<LayoutProvider>(null); //TSI
    private _recyclePool: RecycleItemPool = TSCast.cast<RecycleItemPool>(null); //TSI

    private _params: RenderStackParams | null;
    private _layoutManager: LayoutManager | null = null;
    private _viewabilityTracker: ViewabilityTracker | null = null;
    private _dimensions: Dimension | null;

    constructor(renderStackChanged: (renderStack: RenderStack) => void, scrollOnNextUpdate: (point: Point) => void, isRecyclingEnabled: boolean) {
        //Keeps track of items that need to be rendered in the next render cycle
        this._renderStack = {};

        //Keeps track of keys of all the currently rendered indexes, can eventually replace renderStack as well if no new use cases come up
        this._renderStackIndexKeyMap = {};
        this._renderStackChanged = renderStackChanged;
        this._scrollOnNextUpdate = scrollOnNextUpdate;
        this._dimensions = null;
        this._params = null;
        this._isRecyclingEnabled = isRecyclingEnabled;

        this._isViewTrackerRunning = false;

        //Would be surprised if someone exceeds this
        this._startKey = 0;

        this.onVisibleItemsChanged = null;
        this._onEngagedItemsChanged = this._onEngagedItemsChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
    }

    public getLayoutDimension(): Dimension {
        if (this._layoutManager) {
            return this._layoutManager.getLayoutDimension();
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
            this._layoutManager.reLayoutFromIndex(0, this._params.itemCount);
        }
    }

    public setLayoutProvider(layoutProvider: LayoutProvider): void {
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

    private _getNewKey(): number {
        return this._startKey++;
    }

    private _prepareViewabilityTracker(): void {
        if (this._viewabilityTracker && this._layoutManager && this._dimensions && this._params) {
            this._viewabilityTracker.onEngagedRowsChanged = this._onEngagedItemsChanged;
            if (this.onVisibleItemsChanged) {
                this._viewabilityTracker.onVisibleRowsChanged = this._onVisibleItemsChanged;
            }
            this._viewabilityTracker.setLayouts(this._layoutManager.getLayouts(), this._params.isHorizontal ?
                this._layoutManager.getLayoutDimension().width :
                this._layoutManager.getLayoutDimension().height);
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
        let resolvedIndex = 0;
        let disengagedIndex = 0;
        if (this._isRecyclingEnabled) {
            for (let i = 0; i < count; i++) {
                disengagedIndex = notNow[i];
                resolvedIndex = this._renderStackIndexKeyMap[disengagedIndex];

                if (this._params && disengagedIndex < this._params.itemCount) {
                    //All the items which are now not visible can go to the recycle pool, the pool only needs to maintain keys since
                    //react can link a view to a key automatically
                    this._recyclePool.putRecycledObject(this._layoutProvider.getLayoutTypeForIndex(disengagedIndex), resolvedIndex);
                } else {
                    //Type provider may not be available in this case, use most probable
                    const itemMeta = this._renderStack[resolvedIndex];
                    this._recyclePool.putRecycledObject(itemMeta.type ? itemMeta.type : 0, resolvedIndex);
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
        const count = itemIndexes.length;
        let type = null;
        let availableKey = null;
        let itemMeta: RenderStackItem | null = null;
        let index = 0;
        let hasRenderStackChanged = false;
        for (let i = 0; i < count; i++) {
            index = itemIndexes[i];
            availableKey = this._renderStackIndexKeyMap[index];
            if (availableKey >= 0) {
                //Use if already rendered and remove from pool
                this._recyclePool.removeFromPool(availableKey);
                itemMeta = this._renderStack[availableKey];
                if (itemMeta.key !== availableKey) {
                    hasRenderStackChanged = true;
                    itemMeta.key = availableKey;
                }
            } else {
                hasRenderStackChanged = true;
                type = this._layoutProvider.getLayoutTypeForIndex(index);
                availableKey = this._recyclePool.getRecycledObject(type);
                if (availableKey) {
                    //If available in pool use that key instead
                    availableKey = parseInt(availableKey, 10);
                    itemMeta = this._renderStack[availableKey];
                    if (!itemMeta) {
                        itemMeta = {};
                        this._renderStack[availableKey] = itemMeta;
                    }
                    itemMeta.key = availableKey;
                    itemMeta.type = type;

                    //since this data index is no longer being rendered anywhere
                    if (!ObjectUtil.isNullOrUndefined(itemMeta.dataIndex)) {
                        delete this._renderStackIndexKeyMap[itemMeta.dataIndex];
                    }
                } else {
                    //Create new if no existing key is available
                    itemMeta = {};
                    availableKey = this._getNewKey();
                    itemMeta.key = availableKey;
                    itemMeta.type = type;
                    this._renderStack[availableKey] = itemMeta;
                }

                //TODO:Talha validate if this causes an issue
                //In case of mismatch in pool types we need to make sure only unique data indexes exist in render stack
                //keys are always integers for all practical purposes
                // alreadyRenderedAtKey = this._renderStackIndexKeyMap[index];
                // if (alreadyRenderedAtKey >= 0) {
                //     this._recyclePool.removeFromPool(alreadyRenderedAtKey);
                //     delete this._renderStack[alreadyRenderedAtKey];
                // }
            }
            this._renderStackIndexKeyMap[index] = itemMeta.key;
            itemMeta.dataIndex = index;
        }
        return hasRenderStackChanged;
    }
}
