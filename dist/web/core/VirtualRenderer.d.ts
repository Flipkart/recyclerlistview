import { Dimension, BaseLayoutProvider } from "./dependencies/LayoutProvider";
import { Point, LayoutManager } from "./layoutmanager/LayoutManager";
import ViewabilityTracker, { TOnItemStatusChanged } from "./ViewabilityTracker";
import { BaseDataProvider } from "./dependencies/DataProvider";
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
export interface RenderStack {
    [key: string]: RenderStackItem;
}
export interface RenderStackParams {
    isHorizontal?: boolean;
    itemCount: number;
    initialOffset?: number;
    initialRenderIndex?: number;
    renderAheadOffset?: number;
}
export declare type StableIdProvider = (index: number) => string;
export default class VirtualRenderer {
    private onVisibleItemsChanged;
    private _scrollOnNextUpdate;
    private _stableIdToRenderKeyMap;
    private _engagedIndexes;
    private _renderStack;
    private _renderStackChanged;
    private _fetchStableId;
    private _isRecyclingEnabled;
    private _isViewTrackerRunning;
    private _markDirty;
    private _startKey;
    private _layoutProvider;
    private _recyclePool;
    private _params;
    private _layoutManager;
    private _viewabilityTracker;
    private _dimensions;
    constructor(renderStackChanged: (renderStack: RenderStack) => void, scrollOnNextUpdate: (point: Point) => void, fetchStableId: StableIdProvider, isRecyclingEnabled: boolean);
    getLayoutDimension(): Dimension;
    updateOffset(offsetX: number, offsetY: number, correction: number, isActual: boolean): void;
    attachVisibleItemsListener(callback: TOnItemStatusChanged): void;
    removeVisibleItemsListener(): void;
    getLayoutManager(): LayoutManager | null;
    setParamsAndDimensions(params: RenderStackParams, dim: Dimension): void;
    setLayoutManager(layoutManager: LayoutManager): void;
    setLayoutProvider(layoutProvider: BaseLayoutProvider): void;
    getViewabilityTracker(): ViewabilityTracker | null;
    refreshWithAnchor(): void;
    refresh(): void;
    getInitialOffset(): Point;
    init(): void;
    startViewabilityTracker(): void;
    syncAndGetKey(index: number, overrideStableIdProvider?: StableIdProvider, newRenderStack?: RenderStack): string;
    handleDataSetChange(newDataProvider: BaseDataProvider, shouldOptimizeForAnimations?: boolean): void;
    private _getCollisionAvoidingKey;
    private _prepareViewabilityTracker;
    private _onVisibleItemsChanged;
    private _onEngagedItemsChanged;
    private _updateRenderStack;
}
