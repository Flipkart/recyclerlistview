/// <reference types="react" />
import * as React from "react";
import ContextProvider from "./dependencies/ContextProvider";
import DataProvider from "./dependencies/DataProvider";
import { BaseLayoutProvider } from "./dependencies/LayoutProvider";
import { Layout } from "./layoutmanager/LayoutManager";
import BaseScrollView, { ScrollEvent, ScrollViewDefaultProps } from "./scrollcomponent/BaseScrollView";
import { TOnItemStatusChanged } from "./ViewabilityTracker";
import { RenderStack } from "./VirtualRenderer";
import ItemAnimator from "./ItemAnimator";
/***
 * This is the main component, please refer to samples to understand how to use.
 * For advanced usage check out prop descriptions below.
 * You also get common methods such as: scrollToIndex, scrollToItem, scrollToTop, scrollToEnd, scrollToOffset, getCurrentScrollOffset,
 * findApproxFirstVisibleIndex.
 * You'll need a ref to Recycler in order to call these
 * Needs to have bounded size in all cases other than window scrolling (web).
 *
 * NOTE: React Native implementation uses ScrollView internally which means you get all ScrollView features as well such as Pull To Refresh, paging enabled
 *       You can easily create a recycling image flip view using one paging enabled flag. Read about ScrollView features in official
 *       react native documentation.
 * NOTE: If you see blank space look at the renderAheadOffset prop and make sure your data provider has a good enough rowHasChanged method.
 *       Blanks are totally avoidable with this listview.
 * NOTE: Also works on web (experimental)
 * NOTE: For reflowability set canChangeSize to true (experimental)
 */
export interface OnRecreateParams {
    lastOffset?: number;
}
export interface RecyclerListViewProps {
    layoutProvider: BaseLayoutProvider;
    dataProvider: DataProvider;
    rowRenderer: (type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null;
    contextProvider?: ContextProvider;
    renderAheadOffset?: number;
    isHorizontal?: boolean;
    onScroll?: (rawEvent: ScrollEvent, offsetX: number, offsetY: number) => void;
    onRecreate?: (params: OnRecreateParams) => void;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    onVisibleIndexesChanged?: TOnItemStatusChanged;
    renderFooter?: () => JSX.Element | JSX.Element[] | null;
    externalScrollView?: {
        new (props: ScrollViewDefaultProps): BaseScrollView;
    };
    initialOffset?: number;
    initialRenderIndex?: number;
    scrollThrottle?: number;
    canChangeSize?: boolean;
    distanceFromWindow?: number;
    useWindowScroll?: boolean;
    disableRecycling?: boolean;
    forceNonDeterministicRendering?: boolean;
    extendedState?: object;
    itemAnimator?: ItemAnimator;
    optimizeForInsertDeleteAnimations?: boolean;
    style?: object;
    renderDataCountInOneFrame?: number;
    enableProgressiveRendering?: boolean;
    scrollViewProps?: object;
}
export interface RecyclerListViewState {
    renderStack: RenderStack;
    renderStackCompleted: number;
    totalItemsToRender: number;
    doProgressiveRendering: boolean;
}
export default class RecyclerListView extends React.Component<RecyclerListViewProps, RecyclerListViewState> {
    static defaultProps: {
        canChangeSize: boolean;
        disableRecycling: boolean;
        initialOffset: number;
        initialRenderIndex: number;
        isHorizontal: boolean;
        onEndReachedThreshold: number;
        distanceFromWindow: number;
        renderAheadOffset: number;
        renderDataCountInOneFrame: number;
        enableProgressiveRendering: boolean;
    };
    static propTypes: {};
    private _onEndReachedCalled;
    private _virtualRenderer;
    private _initComplete;
    private _relayoutReqIndex;
    private _params;
    private _layout;
    private _pendingScrollToOffset;
    private _tempDim;
    private _initialOffset;
    private _cachedLayouts?;
    private _scrollComponent;
    private _defaultItemAnimator;
    private _requestAnimationFrameHandler;
    constructor(props: RecyclerListViewProps);
    componentWillReceiveProps(newProps: RecyclerListViewProps): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    componentWillMount(): void;
    scrollToIndex(index: number, animate?: boolean): void;
    scrollToItem(data: any, animate?: boolean): void;
    getLayout(index: number): Layout | undefined;
    scrollToTop(animate?: boolean): void;
    scrollToEnd(animate?: boolean): void;
    scrollToOffset(x: number, y: number, animate?: boolean): void;
    getCurrentScrollOffset(): number;
    findApproxFirstVisibleIndex(): number;
    render(): JSX.Element;
    private _isMoreItemsToRender();
    private _checkAndChangeLayouts(newProps, forceFullRender?);
    private _refreshViewability();
    private _queueStateRefresh();
    private _onSizeChanged(layout);
    private _renderStackWhenReady(stack);
    private _cancelProgressiveUpdate();
    private _initTrackers();
    private _assertDependencyPresence(props);
    private _assertType(type);
    private _dataHasChanged(row1, row2);
    private _renderRowUsingMeta(itemMeta);
    private _onViewContainerSizeChange(dim, index);
    private _checkExpectedDimensionDiscrepancy(itemRect, type, index);
    private _generateRenderStack();
    private _onScroll(offsetX, offsetY, rawEvent);
    private _processOnEndReached();
}
