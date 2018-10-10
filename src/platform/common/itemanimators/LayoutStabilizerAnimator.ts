import { RAFHelper } from "../../../utils/RAFHelper";
import { BaseItemAnimator } from "../../../core/ItemAnimator";

interface UnmountAwareView {
    _isUnmountedForRecyclerListView?: boolean;
    setNativeProps: (obj: object) => void;
    style?: any;
}

/**
 * This animator prevents views from shifting up/down.
 * This is stateful and thus, will work once per mount. Make sure you pass a new instance for every
 * new RLV mount.
 */
export class LayoutStabilizerAnimator extends BaseItemAnimator {
    private _isQueueComplete: boolean = false;
    private _stabilizationInProgress = false;
    private _stabilizationComplete = false;
    private _lastProcessingTS: number = 0;
    private _indexBounds = { min: 0, max: 0 };
    private _viewCache?: object[] = [];
    private readonly _numberOfFramesToBatch: number;

    public constructor(numberOfFramesToBatch: number = 3) {
        super();
        this._numberOfFramesToBatch = numberOfFramesToBatch;
    }

    public shouldPersistStyleOverrides(): boolean {
        return !this._isStabilizationComplete();
    }

    public animateWillMount(atX: number, atY: number, itemIndex: number): object | undefined {
        if (this.isRecreateFlow && !this._isStabilizationComplete()) {
            this._completeStabilization();
            this._isQueueComplete = true;
        } else if (!this._isQueueComplete) {
            this._indexBounds.min = Math.min(itemIndex, this._indexBounds.min);
            this._indexBounds.max = Math.max(itemIndex, this._indexBounds.max);
            return { opacity: 0 };
        }
        return undefined;
    }
    public animateDidMount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        if (!this._isQueueComplete && itemIndex >= this._indexBounds.min && itemIndex <= this._indexBounds.max) {
            if (this._viewCache) {
                this._viewCache.push(itemRef);
                if (itemIndex === this._indexBounds.max) {
                    this._isQueueComplete = true;
                }
            }
            this._checkForMovementAndStabilize(itemIndex);
        }
    }

    public animateWillUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): void {
        this._checkForMovementAndStabilize(itemIndex);
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object, itemIndex: number): boolean {
        this._checkForMovementAndStabilize(itemIndex);
        return false;
    }

    public animateWillUnmount(atX: number, atY: number, itemRef: object, itemIndex: number): void {
        (itemRef as UnmountAwareView)._isUnmountedForRecyclerListView = true;
    }

    private _checkForMovementAndStabilize(itemIndex: number): void {
        if (itemIndex >= this._indexBounds.min && itemIndex <= this._indexBounds.max) {
            let currentTS = Date.now();
            this._lastProcessingTS = Date.now();
            if (!this._hasStabilizationStartedOrComplete()) {
                this._startStabilization();
                RAFHelper.executeOnRAF((token) => {
                    if (this._lastProcessingTS === currentTS) {
                        token.terminate();
                        this._completeStabilization();
                        this._unHideViews();
                    } else {
                        currentTS = this._lastProcessingTS;
                    }
                }, this._numberOfFramesToBatch);
            }
        }
    }

    private _startStabilization(): void {
        this._stabilizationInProgress = true;
    }

    private _completeStabilization(): void {
        this._stabilizationInProgress = false;
        this._stabilizationComplete = true;
    }

    private _hasStabilizationStartedOrComplete(): boolean {
        return this._stabilizationInProgress || this._stabilizationComplete;
    }

    private _isStabilizationComplete(): boolean {
        return this._stabilizationComplete;
    }

    private _unHideViews(): void {
        if (this._viewCache) {
            this._viewCache.forEach((arrItem) => {
                const view = arrItem as UnmountAwareView;
                if (!view._isUnmountedForRecyclerListView) {
                    if (view.setNativeProps) {
                        view.setNativeProps({ style: { opacity: 1 } });
                    } else if (view.style) {
                        view.style.opacity = 1;
                    }
                }
            });
            this._viewCache = undefined;
        }
    }
}
