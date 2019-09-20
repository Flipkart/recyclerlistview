import RecyclerListView, { RecyclerListViewProps, RecyclerListViewState } from "./RecyclerListView";
export interface ProgressiveListViewProps extends RecyclerListViewProps {
    maxRenderAhead?: number;
    renderAheadStep?: number;
}
/**
 * This will incremently update renderAhread distance and render the page progressively.
 */
export default class ProgressiveListView extends RecyclerListView<ProgressiveListViewProps, RecyclerListViewState> {
    static defaultProps: {
        maxRenderAhead: number;
        renderAheadStep: number;
        renderAheadOffset: number;
        canChangeSize: boolean;
        disableRecycling: boolean;
        initialOffset: number;
        initialRenderIndex: number;
        isHorizontal: boolean;
        onEndReachedThreshold: number;
        distanceFromWindow: number;
    };
    private renderAheadUdpateCallbackId?;
    componentDidMount(): void;
    private updateRenderAheadProgessively;
    private incrementRenderAhead;
    private cancelRenderAheadUpdate;
}
