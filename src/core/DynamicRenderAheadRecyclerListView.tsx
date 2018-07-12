import RecyclerListView, { RecyclerListViewProps, RecyclerListViewState } from "./RecyclerListView";

export interface DynamicRenderAheadRecyclerListViewProps extends RecyclerListViewProps{
    maxRenderAhead?: number;
    renderAheadStep?: number;
}

export default class DynamicRenderAheadRecyclerListView extends RecyclerListView<DynamicRenderAheadRecyclerListViewProps, RecyclerListViewState> {
    protected renderAheadUdpateCallbackId?: number;
    public static defaultProps = {
        ...RecyclerListView.defaultProps,
        maxRenderAhead: Number.MAX_VALUE,
        renderAheadStep: 100
    };

    public componentDidUpdate(): void {
        if (this.props.maxRenderAhead && this.props.renderAheadStep) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            const currentRenderAheadOffset = this.getRenderAheadOffset();
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

    protected _updateOffset(newVal: number) {
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUdpateCallbackId = requestAnimationFrame(() => {
            if (!this.updateRenderAheadOffset(newVal)) {
                this._updateOffset(newVal);
            }
        })
    }

    protected cancelRenderAheadUpdate() {
        if (this.renderAheadUdpateCallbackId) {
            cancelAnimationFrame(this.renderAheadUdpateCallbackId)
        }
    }
}

// DynamicRenderAheadRecyclerListView.prototype = {
//     ...RecyclerListView.propTypes,
//     maxRenderAhead: PropTypes.number,
//     renderAheadStep: PropTypes.number
// }