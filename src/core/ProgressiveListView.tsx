import RecyclerListView, { RecyclerListViewProps, RecyclerListViewState } from "./RecyclerListView";
export interface ProgressiveListViewProps extends RecyclerListViewProps {
    maxRenderAhead?: number;
    renderAheadStep?: number;

    /**
     * A smaller final value can help in building up recycler pool in advance. This is only used if there is a valid updated cycle.
     * e.g, if maxRenderAhead is 0 then there will be no cycle and final value will be unused
     */
    finalRenderAheadOffset?: number;
}
/**
 * This will incrementally update renderAhead distance and render the page progressively.
 * renderAheadOffset = initial value which will be incremented
 * renderAheadStep = amount of increment made on each frame
 * maxRenderAhead = maximum value for render ahead at the end of update cycle
 * finalRenderAheadOffset = value to set after whole update cycle is completed. If undefined, final offset value will be equal to maxRenderAhead
 */
export default class ProgressiveListView extends RecyclerListView<ProgressiveListViewProps, RecyclerListViewState> {
    public static defaultProps = {
        ...RecyclerListView.defaultProps,
        maxRenderAhead: Number.MAX_VALUE,
        renderAheadStep: 300,
        renderAheadOffset: 0,
    };
    private renderAheadUpdateCallbackId?: number;
    private isFirstLayoutComplete: boolean = false;

    public componentDidMount(): void {
        super.componentDidMount();
        if (!this.props.forceNonDeterministicRendering) {
            this.updateRenderAheadProgressively(this.getCurrentRenderAheadOffset());
        }
    }

    public componentWillUnmount(): void {
        this.cancelRenderAheadUpdate();
        super.componentWillUnmount();
    }

    protected onItemLayout(index: number): void {
        if (!this.isFirstLayoutComplete) {
            this.isFirstLayoutComplete = true;
            if (this.props.forceNonDeterministicRendering) {
                this.updateRenderAheadProgressively(this.getCurrentRenderAheadOffset());
            }
        }
        super.onItemLayout(index);
    }

    private updateRenderAheadProgressively(newVal: number): void {
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUpdateCallbackId = requestAnimationFrame(() => {
            if (!this.updateRenderAheadOffset(newVal)) {
                this.updateRenderAheadProgressively(newVal);
            } else {
                this.incrementRenderAhead();
            }
        });
    }

    private incrementRenderAhead(): void {
        if (this.props.maxRenderAhead && this.props.renderAheadStep) {
            const layoutManager = this.getVirtualRenderer().getLayoutManager();
            const currentRenderAheadOffset = this.getCurrentRenderAheadOffset();
            if (layoutManager) {
                const contentDimension = layoutManager.getContentDimension();
                const maxContentSize = this.props.isHorizontal ? contentDimension.width : contentDimension.height;
                if (currentRenderAheadOffset < maxContentSize && currentRenderAheadOffset < this.props.maxRenderAhead) {
                    const newRenderAheadOffset = currentRenderAheadOffset + this.props.renderAheadStep;
                    this.updateRenderAheadProgressively(newRenderAheadOffset);
                } else {
                    this.performFinalUpdate();
                }
            }
        }
    }

    private performFinalUpdate(): void {
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUpdateCallbackId = requestAnimationFrame(() => {
        if (this.props.finalRenderAheadOffset !== undefined) {
                this.updateRenderAheadOffset(this.props.finalRenderAheadOffset);
            }
        });
    }

    private cancelRenderAheadUpdate(): void {
        if (this.renderAheadUpdateCallbackId !== undefined) {
            cancelAnimationFrame(this.renderAheadUpdateCallbackId);
        }
    }
}
