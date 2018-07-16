import RecyclerListView, { RecyclerListViewProps, RecyclerListViewState } from "./RecyclerListView";

export interface ProgressiveListViewProps extends RecyclerListViewProps {
    maxRenderAhead?: number;
    renderAheadStep?: number;
}
/**
 * This will incremently update renderAhread distance and render the page progressively.
 */
export default class ProgressiveListView extends RecyclerListView<ProgressiveListViewProps, RecyclerListViewState> {
    public static defaultProps = {
        ...RecyclerListView.defaultProps,
        maxRenderAhead: Number.MAX_VALUE,
        renderAheadStep: 100,
    };
    private renderAheadUdpateCallbackId?: number;

    public componentDidMount(): void {
        if (super.componentDidMount) {
            super.componentDidMount();
        }
        this._updateOffset(this.getCurrentRenderAheadOffset());
    }

    private _updateOffset(newVal: number): void {
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUdpateCallbackId = requestAnimationFrame(() => {
            if (!this.updateRenderAheadOffset(newVal)) {
                this._updateOffset(newVal);
            } else {
                this.incrementRenderAhead();
            }
        });
    }

    private incrementRenderAhead(): void {
        if (this.props.maxRenderAhead && this.props.renderAheadStep) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            const currentRenderAheadOffset = this.getCurrentRenderAheadOffset();
            if (layoutManager && currentRenderAheadOffset !== -1) {
                const contentDimension = layoutManager.getContentDimension();
                const maxContentSize = this.props.isHorizontal ? contentDimension.width : contentDimension.height;
                if (currentRenderAheadOffset < maxContentSize && currentRenderAheadOffset < this.props.maxRenderAhead ) {
                    const newRenderAheadOffset = currentRenderAheadOffset + this.props.renderAheadStep;
                    this._updateOffset(newRenderAheadOffset);
                }
            }
        }
    }

    private cancelRenderAheadUpdate(): void {
        if (this.renderAheadUdpateCallbackId) {
            cancelAnimationFrame(this.renderAheadUdpateCallbackId);
        }
    }
}
