import { Default } from "ts-object-utils";
import TSCast from "../utils/TSCast";
import { BaseLayoutProvider, Dimension } from "./dependencies/LayoutProvider";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import { LayoutManager, Point } from "./layoutmanager/LayoutManager";
import { MVCConfigItem } from "./RecyclerListView";
import ViewabilityTracker, { WindowCorrection } from "./ViewabilityTracker";
import { RenderStackParams } from "./VirtualRenderer";

export default class MVCManager {

    private _isMVCTrackersRunning: boolean;
    private _mvcConfig: MVCConfigItem[] | null = null;
    private _viewabilityTrackers: ViewabilityTracker[] = [];
    private _params: RenderStackParams | null;
    private _dimensions: Dimension | null;
    private _layoutManager: LayoutManager | null = null;
    private _layoutProvider: BaseLayoutProvider = TSCast.cast<BaseLayoutProvider>(null);
    
    constructor(MVCConfig: MVCConfigItem[]) {
        this._mvcConfig = MVCConfig;
        this._dimensions = null;
        this._params = null;
        this._isMVCTrackersRunning = false;
    }

    public setParamsAndDimensions(params: RenderStackParams, dim: Dimension): void {
        this._params = params;
        this._dimensions = dim;
    }

    public getInitialOffset(): void {
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
    }

    private _prepareViewabilityTracker(): void {
        if (this._viewabilityTrackers && this._layoutManager && this._dimensions && this._params) {
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    this._layoutManager && this._params && viewabilityTracker.setLayouts(this._layoutManager.getLayouts(), this._params.isHorizontal ?
                    this._layoutManager.getContentDimension().width :
                    this._layoutManager.getContentDimension().height);
                    
                    this._dimensions && this._params && viewabilityTracker.setDimensions({
                        height: this._dimensions.height,
                        width: this._dimensions.width,
                    }, Default.value<boolean>(this._params.isHorizontal, false));
                }
            );
        } else {
            throw new CustomError(RecyclerListViewExceptions.initializationException);
        }
    }


    public init(): void {
        this.getInitialOffset();
        if (this._mvcConfig) {
            (this._mvcConfig).forEach(
                (pair) => {
                    if (this._params) {
                        this._viewabilityTrackers.push(
                            new ViewabilityTracker(
                                Default.value<number>(this._params.renderAheadOffset, 0),
                                Default.value<number>(this._params.initialOffset, 0),
                                pair.viewabilityConfig,
                                pair.onViewableItemsChanged
                            )    
                        );
                    } else {
                        this._viewabilityTrackers.push(
                            new ViewabilityTracker(0, 0, pair.viewabilityConfig, pair.onViewableItemsChanged)    
                        );
                    }
                }
            );
            this._prepareViewabilityTracker();
        }
    }

    public startViewabilityTracker(windowCorrection: WindowCorrection): void {
        if (this._viewabilityTrackers) {
            this._isMVCTrackersRunning = true;
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    viewabilityTracker.init(windowCorrection);
                }
            )
        }
    }

    public updateOffset(offsetX: number, offsetY: number, isActual: boolean, correction: WindowCorrection) {
        const offset = this._params && this._params.isHorizontal ? offsetX : offsetY;
        if (this._viewabilityTrackers) {
            if (!this._isMVCTrackersRunning) {
                if (isActual) {
                    this._viewabilityTrackers.forEach(
                        (viewabilityTracker) => {
                            viewabilityTracker.setActualOffset(offset);
                            viewabilityTracker.init(correction);
                        }
                    );
                }
                this._isMVCTrackersRunning = true;
            }
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    viewabilityTracker.updateOffset(offset, isActual, correction);
                }
            )
        }
    }

    public timersCleanup(): void {
        if (!this._viewabilityTrackers || this._viewabilityTrackers.length === 0) {
            return;
        }
        this._viewabilityTrackers.forEach(
            (viewabilityTracker) => {
                viewabilityTracker.timerCleanup();
            }
        )
    }

    public removeMVCConfig(): void {
        this._mvcConfig = null;

        if (this._viewabilityTrackers.length > 0) {
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    viewabilityTracker.onVisibleRowsChanged = null;
                    viewabilityTracker.timerCleanup();
                }
            )
        }
        this._viewabilityTrackers = []
    }

    public updateMVCConfig(MVCConfig: MVCConfigItem[]): void {
        this._mvcConfig = MVCConfig;
        let countConfig = this._mvcConfig.length
        let countVT = this._viewabilityTrackers.length
        let i = 0
        while(countConfig > 0 && countVT > 0) {
            this._viewabilityTrackers[i].updateViewabilityConfig(this._mvcConfig[i].viewabilityConfig)
            this._viewabilityTrackers[i].onVisibleRowsChanged = this._mvcConfig[i].onViewableItemsChanged
            --countConfig
            --countVT
            ++i
        }

        if (countConfig > 0) {
            if (this._params) {
                while(countConfig > 0) {
                    this._viewabilityTrackers.push(
                        new ViewabilityTracker(
                            Default.value<number>(this._params.renderAheadOffset, 0),
                            Default.value<number>(this._params.initialOffset, 0),
                            this._mvcConfig[i].viewabilityConfig,
                            this._mvcConfig[i].onViewableItemsChanged
                        )    
                    );
                    --countConfig
                    ++i
                }
            } else {
                while(countConfig > 0) {
                    this._viewabilityTrackers.push(
                        new ViewabilityTracker(0, 0, this._mvcConfig[i].viewabilityConfig,
                            this._mvcConfig[i].onViewableItemsChanged)    
                    );
                    --countConfig
                    ++i
                }
            }
        }
        
        if (countVT > 0) {
            while(countVT > 0) {
                this._viewabilityTrackers[i].onVisibleRowsChanged = null
                this._viewabilityTrackers[i].timerCleanup()
                --countVT
                ++i
            }
        }
        this._viewabilityTrackers.length = this._mvcConfig.length
    }

    public refreshWithAnchor(): void {
        let firstVisibleIndex = this._viewabilityTrackers[0].findFirstLogicallyVisibleIndex();
        if (this._viewabilityTrackers) {
            this._prepareViewabilityTracker();
            let offset = 0;
            if (this._layoutManager && this._params) {
                firstVisibleIndex = Math.min(this._params.itemCount - 1, firstVisibleIndex);
                const point = this._layoutManager.getOffsetForIndex(firstVisibleIndex);
                offset = this._params.isHorizontal ? point.x : point.y;
            }
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    viewabilityTracker.forceRefreshWithOffset(offset);
                }
            )
        }
    }

    public refresh(): void {
        if (this._viewabilityTrackers) {
            this._prepareViewabilityTracker();
            
            this._viewabilityTrackers.forEach(
                (viewabilityTracker) => {
                    viewabilityTracker.forceRefresh();
                }
            )
        }
    }


    public setLayoutManager(layoutManager: LayoutManager): void {
        this._layoutManager = layoutManager;
        if (this._params) {
            this._layoutManager.relayoutFromIndex(0, this._params.itemCount);
        }
    }

    public setLayoutProvider(layoutProvider: BaseLayoutProvider): void {
        this._layoutProvider = layoutProvider
    }

}