import RecyclerListView, { RecyclerListViewProps, RecyclerListViewState } from "./RecyclerListView";
export interface DynamicRenderAheadRecyclerListViewProps extends RecyclerListViewProps {
    maxRenderAhead?: number;
    renderAheadStep?: number;
}
export default class DynamicRenderAheadRecyclerListView extends RecyclerListView<DynamicRenderAheadRecyclerListViewProps, RecyclerListViewState> {
    protected renderAheadUdpateCallbackId?: number;
    static defaultProps: {
        maxRenderAhead: number;
        renderAheadStep: number;
        canChangeSize: boolean;
        disableRecycling: boolean;
        initialOffset: number;
        initialRenderIndex: number;
        isHorizontal: boolean;
        onEndReachedThreshold: number;
        distanceFromWindow: number;
        renderAheadOffset: number;
    };
    componentDidUpdate(): void;
    protected _updateOffset(newVal: number): void;
    protected cancelRenderAheadUpdate(): void;
}
