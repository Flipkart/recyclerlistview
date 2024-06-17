/***
 * DONE: Reduce layout processing on data insert
 * DONE: Add notify data set changed and notify data insert option in data source
 * DONE: Add on end reached callback
 * DONE: Make another class for render stack generator
 * DONE: Simplify rendering a loading footer
 * DONE: Anchor first visible index on any insert/delete data wise
 * DONE: Build Scroll to index
 * DONE: Give viewability callbacks
 * DONE: Add full render logic in cases like change of dimensions
 * DONE: Fix all proptypes
 * DONE: Add Initial render Index support
 * DONE: Add animated scroll to web scrollviewer
 * DONE: Animate list view transition, including add/remove
 * DONE: Implement sticky headers and footers
 * TODO: Destroy less frequently used items in recycle pool, this will help in case of too many types.
 * TODO: Make viewability callbacks configurable
 * TODO: Observe size changes on web to optimize for reflowability
 * TODO: Solve //TSI
 */
import debounce = require("lodash.debounce");
import * as PropTypes from "prop-types";
import * as React from "react";
import { ObjectUtil, Default } from "ts-object-utils";
import ContextProvider from "./dependencies/ContextProvider";
import { BaseDataProvider } from "./dependencies/DataProvider";
import { Dimension, BaseLayoutProvider } from "./dependencies/LayoutProvider";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import { Point, Layout, LayoutManager } from "./layoutmanager/LayoutManager";
import { Constants } from "./constants/Constants";
import { Messages } from "./constants/Messages";
import BaseScrollComponent from "./scrollcomponent/BaseScrollComponent";
import BaseScrollView, { ScrollEvent, ScrollViewDefaultProps } from "./scrollcomponent/BaseScrollView";
import { TOnItemStatusChanged, WindowCorrection } from "./ViewabilityTracker";
import VirtualRenderer, { RenderStack, RenderStackItem, RenderStackParams } from "./VirtualRenderer";
import ItemAnimator, { BaseItemAnimator } from "./ItemAnimator";
import { DebugHandlers } from "..";
import { ComponentCompat } from "../utils/ComponentCompat";
//#if [REACT-NATIVE]
import ScrollComponent from "../platform/reactnative/scrollcomponent/ScrollComponent";
import ViewRenderer from "../platform/reactnative/viewrenderer/ViewRenderer";
import { DefaultJSItemAnimator as DefaultItemAnimator } from "../platform/reactnative/itemanimators/defaultjsanimator/DefaultJSItemAnimator";
import { Platform, ScrollView } from "react-native";
const IS_WEB = !Platform || Platform.OS === "web";
//#endif

/***
 * To use on web, start importing from recyclerlistview/web. To make it even easier specify an alias in you builder of choice.
 */

//#if [WEB]
//import ScrollComponent from "../platform/web/scrollcomponent/ScrollComponent";
//import ViewRenderer from "../platform/web/viewrenderer/ViewRenderer";
//import { DefaultWebItemAnimator as DefaultItemAnimator } from "../platform/web/itemanimators/DefaultWebItemAnimator";
//const IS_WEB = true;
//type ScrollView = unknown;
//#endif

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
    dataProvider: BaseDataProvider;
    rowRenderer: (type: string | number, data: any, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
    contextProvider?: ContextProvider;
    renderAheadOffset?: number;
    isHorizontal?: boolean;
    onScroll?: (rawEvent: ScrollEvent, offsetX: number, offsetY: number) => void;
    onRecreate?: (params: OnRecreateParams) => void;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    onEndReachedThresholdRelative?: number;
    onVisibleIndexesChanged?: TOnItemStatusChanged;
    onVisibleIndicesChanged?: TOnItemStatusChanged;
    renderFooter?: () => JSX.Element | JSX.Element[] | null;
    externalScrollView?: { new(props: ScrollViewDefaultProps): BaseScrollView };
    layoutSize?: Dimension;
    initialOffset?: number;
    initialRenderIndex?: number;
    scrollThrottle?: number;
    canChangeSize?: boolean;
    useWindowScroll?: boolean;
    disableRecycling?: boolean;
    forceNonDeterministicRendering?: boolean;
    extendedState?: object;
    itemAnimator?: ItemAnimator;
    optimizeForInsertDeleteAnimations?: boolean;
    style?: object | number;
    debugHandlers?: DebugHandlers;
    renderContentContainer?: (props?: object, children?: React.ReactNode) => React.ReactNode | null;
    renderItemContainer?: (props: object, parentProps: object, children?: React.ReactNode) => React.ReactNode;
    //For all props that need to be proxied to inner/external scrollview. Put them in an object and they'll be spread
    //and passed down. For better typescript support.
    scrollViewProps?: object;
    applyWindowCorrection?: (offsetX: number, offsetY: number, windowCorrection: WindowCorrection) => void;
    onItemLayout?: (index: number) => void;
    windowCorrectionConfig?: { value?: WindowCorrection, applyToInitialOffset?: boolean, applyToItemScroll?: boolean };

    //This can lead to inconsistent behavior. Use with caution.
    //If set to true, recyclerlistview will not measure itself if scrollview mounts with zero height or width.
    //If there are no following events with right dimensions nothing will be rendered.
    suppressBoundedSizeException?: boolean;
}

export interface RecyclerListViewState {
    renderStack: RenderStack;
    internalSnapshot: Record<string, object>;
}

export interface WindowCorrectionConfig {
    value: WindowCorrection;
    applyToInitialOffset: boolean;
    applyToItemScroll: boolean;
}

export default class RecyclerListView<P extends RecyclerListViewProps, S extends RecyclerListViewState> extends ComponentCompat<P, S> {
    public static defaultProps = {
        canChangeSize: false,
        disableRecycling: false,
        initialOffset: 0,
        initialRenderIndex: 0,
        isHorizontal: false,
        onEndReachedThreshold: 0,
        onEndReachedThresholdRelative: 0,
        renderAheadOffset: IS_WEB ? 1000 : 250,
    };

    public static propTypes = {};

    private refreshRequestDebouncer = debounce((executable: () => void) => {
        executable();
    });

    private _virtualRenderer: VirtualRenderer;
    private _onEndReachedCalled = false;
    private _initComplete = false;
    private _isMounted = true;
    private _relayoutReqIndex: number = -1;
    private _params: RenderStackParams = {
        initialOffset: 0,
        initialRenderIndex: 0,
        isHorizontal: false,
        itemCount: 0,
        renderAheadOffset: 250,
    };
    private _layout: Dimension = { height: 0, width: 0 };
    private _pendingScrollToOffset: Point | null = null;
    private _pendingRenderStack?: RenderStack;
    private _tempDim: Dimension = { height: 0, width: 0 };
    private _initialOffset = 0;
    private _cachedLayouts?: Layout[];
    private _scrollComponent: BaseScrollComponent | null = null;
    private _windowCorrectionConfig: WindowCorrectionConfig;

    //If the native content container is used, then positions of the list items are changed on the native side. The animated library used
    //by the default item animator also changes the same positions which could lead to inconsistency. Hence, the base item animator which
    //does not perform any such animations will be used.
    private _defaultItemAnimator: ItemAnimator = new BaseItemAnimator();

    constructor(props: P, context?: any) {
        super(props, context);
        this._virtualRenderer = new VirtualRenderer(this._renderStackWhenReady, (offset) => {
            this._pendingScrollToOffset = offset;
        }, (index) => {
            return this.props.dataProvider.getStableId(index);
        }, !props.disableRecycling);

        if (this.props.windowCorrectionConfig) {
            let windowCorrection;
            if (this.props.windowCorrectionConfig.value) {
                windowCorrection = this.props.windowCorrectionConfig.value;
            } else {
                windowCorrection = {  startCorrection: 0, endCorrection: 0, windowShift: 0  };
            }
            this._windowCorrectionConfig = {
                applyToItemScroll: !!this.props.windowCorrectionConfig.applyToItemScroll,
                applyToInitialOffset: !!this.props.windowCorrectionConfig.applyToInitialOffset,
                value: windowCorrection,
             };
        } else {
            this._windowCorrectionConfig = {
                applyToItemScroll: false,
                applyToInitialOffset: false,
                value: { startCorrection: 0, endCorrection: 0, windowShift: 0 },
             };
        }
        this._getContextFromContextProvider(props);
        if (props.layoutSize) {
            this._layout.height = props.layoutSize.height;
            this._layout.width = props.layoutSize.width;
            this._initComplete = true;
            this._initTrackers(props);
        } else {
            this.state = {
                internalSnapshot: {},
                renderStack: {},
            } as S;
        }
    }

    public componentWillReceivePropsCompat(newProps: RecyclerListViewProps): void {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!newProps.onVisibleIndicesChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        if (newProps.onVisibleIndexesChanged) {
            throw new CustomError(RecyclerListViewExceptions.usingOldVisibleIndexesChangedParam);
        }
        if (newProps.onVisibleIndicesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(newProps.onVisibleIndicesChanged!);
        }
    }

    public componentDidUpdate(): void {
        this._processInitialOffset();
        this._processOnEndReached();
        this._checkAndChangeLayouts(this.props);
        this._virtualRenderer.setOptimizeForAnimations(false);
    }

    public componentDidMount(): void {
        if (this._initComplete) {
            this._processInitialOffset();
            this._processOnEndReached();
        }
    }

    public componentWillUnmount(): void {
        this._isMounted = false;
        if (this.props.contextProvider) {
            const uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                this.props.contextProvider.save(uniqueKey + Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX, this.getCurrentScrollOffset());
                if (this.props.forceNonDeterministicRendering) {
                    if (this._virtualRenderer) {
                        const layoutManager = this._virtualRenderer.getLayoutManager();
                        if (layoutManager) {
                            const layoutsToCache = layoutManager.getLayouts();
                            this.props.contextProvider.save(uniqueKey + Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX,
                                JSON.stringify({ layoutArray: layoutsToCache }));
                        }
                    }
                }
            }
        }
    }

    public scrollToIndex(index: number, animate?: boolean): void {
        const layoutManager = this._virtualRenderer.getLayoutManager();
        if (layoutManager) {
            const offsets = layoutManager.getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate, this._windowCorrectionConfig.applyToItemScroll);
        } else {
            console.warn(Messages.WARN_SCROLL_TO_INDEX); //tslint:disable-line
        }
    }

    /**
     * This API is almost similar to scrollToIndex, but differs when the view is already in viewport.
     * Instead of bringing the view to the top of the viewport, it will calculate the overflow of the @param index
     * and scroll to just bring the entire view to viewport.
     */
    public bringToFocus(index: number, animate?: boolean): void {
        const listSize = this.getRenderedSize();
        const itemLayout = this.getLayout(index);
        const currentScrollOffset = this.getCurrentScrollOffset() + this._windowCorrectionConfig.value.windowShift;
        const {isHorizontal} = this.props;
        if (itemLayout) {
            const mainAxisLayoutDimen = isHorizontal ? itemLayout.width : itemLayout.height;
            const mainAxisLayoutPos = isHorizontal ? itemLayout.x : itemLayout.y;
            const mainAxisListDimen = isHorizontal ? listSize.width : listSize.height;
            const screenEndPos = mainAxisListDimen + currentScrollOffset;
            if (mainAxisLayoutDimen > mainAxisListDimen || mainAxisLayoutPos < currentScrollOffset || mainAxisLayoutPos > screenEndPos) {
                this.scrollToIndex(index);
            } else {
                const viewEndPos = mainAxisLayoutPos + mainAxisLayoutDimen;
                if (viewEndPos > screenEndPos) {
                    const offset = viewEndPos - screenEndPos;
                    this.scrollToOffset(offset + currentScrollOffset, offset + currentScrollOffset, animate, true);
                }
            }
        }
    }

    public scrollToItem(data: any, animate?: boolean): void {
        const count = this.props.dataProvider.getSize();
        for (let i = 0; i < count; i++) {
            if (this.props.dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    }

    public getLayout(index: number): Layout | undefined {
        const layoutManager = this._virtualRenderer.getLayoutManager();
        return layoutManager ? layoutManager.getLayouts()[index] : undefined;
    }

    public scrollToTop(animate?: boolean): void {
        this.scrollToOffset(0, 0, animate);
    }

    public scrollToEnd(animate?: boolean): void {
        const lastIndex = this.props.dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    }

    // useWindowCorrection specifies if correction should be applied to these offsets in case you implement
    // `applyWindowCorrection` method
    public scrollToOffset = (x: number, y: number, animate: boolean = false, useWindowCorrection: boolean = false): void => {
        if (this._scrollComponent) {
            if (this.props.isHorizontal) {
                y = 0;
                x = useWindowCorrection ? x - this._windowCorrectionConfig.value.windowShift : x;
            } else {
                x = 0;
                y = useWindowCorrection ? y - this._windowCorrectionConfig.value.windowShift : y;
            }
            this._scrollComponent.scrollTo(x, y, animate);
        }
    }

    // You can use requestAnimationFrame callback to change renderAhead in multiple frames to enable advanced progressive
    // rendering when view types are very complex. This method returns a boolean saying if the update was committed. Retry in
    // the next frame if you get a failure (if mount wasn't complete). Value should be greater than or equal to 0;
    // Very useful when you have a page where you need a large renderAheadOffset. Setting it at once will slow down the load and
    // this will help mitigate that.
    public updateRenderAheadOffset(renderAheadOffset: number): boolean {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        if (viewabilityTracker) {
            viewabilityTracker.updateRenderAheadOffset(renderAheadOffset);
            return true;
        }
        return false;
    }

    public getCurrentRenderAheadOffset(): number {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        if (viewabilityTracker) {
            return viewabilityTracker.getCurrentRenderAheadOffset();
        }
        return this.props.renderAheadOffset!;
    }

    public getCurrentScrollOffset(): number {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.getLastActualOffset() : 0;
    }

    public findApproxFirstVisibleIndex(): number {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.findFirstLogicallyVisibleIndex() : 0;
    }

    public getRenderedSize(): Dimension {
        return this._layout;
    }

    public getContentDimension(): Dimension {
        return this._virtualRenderer.getLayoutDimension();
    }

    // Force Rerender forcefully to update view renderer. Use this in rare circumstances
    public forceRerender(): void {
        this.setState({
            internalSnapshot: {},
        });
    }

    public getScrollableNode(): number | null {
        if (this._scrollComponent && this._scrollComponent.getScrollableNode) {
          return this._scrollComponent.getScrollableNode();
        }
        return null;
    }

    public getNativeScrollRef(): ScrollView | null {
        if (this._scrollComponent && this._scrollComponent.getNativeScrollRef) {
          return this._scrollComponent.getNativeScrollRef();
        }
        return null;
    }

    public renderCompat(): JSX.Element {
        //TODO:Talha
        // const {
        //     layoutProvider,
        //     dataProvider,
        //     contextProvider,
        //     renderAheadOffset,
        //     onEndReached,
        //     onEndReachedThreshold,
        //     onVisibleIndicesChanged,
        //     initialOffset,
        //     initialRenderIndex,
        //     disableRecycling,
        //     forceNonDeterministicRendering,
        //     extendedState,
        //     itemAnimator,
        //     rowRenderer,
        //     ...props,
        // } = this.props;

        return (
            <ScrollComponent
                ref={(scrollComponent) => this._scrollComponent = scrollComponent as BaseScrollComponent | null}
                {...this.props}
                {...this.props.scrollViewProps}
                onScroll={this._onScroll}
                onSizeChanged={this._onSizeChanged}
                contentHeight={this._initComplete ? this._virtualRenderer.getLayoutDimension().height : 0}
                contentWidth={this._initComplete ? this._virtualRenderer.getLayoutDimension().width : 0}
                renderAheadOffset={this.getCurrentRenderAheadOffset()}>
                {this._generateRenderStack()}
            </ScrollComponent>
        );
    }

    // Disables recycling for the next frame so that layout animations run well.
    // WARNING: Avoid this when making large changes to the data as the list might draw too much to run animations. Single item insertions/deletions
    // should be good. With recycling paused the list cannot do much optimization.
    // The next render will run as normal and reuse items.
    public prepareForLayoutAnimationRender(): void {
        this._virtualRenderer.setOptimizeForAnimations(true);
    }

    protected getVirtualRenderer(): VirtualRenderer {
        return this._virtualRenderer;
    }
    protected onItemLayout(index: number): void {
        if (this.props.onItemLayout) {
            this.props.onItemLayout(index);
        }
    }

    private _onItemLayout = (index: number) => {
        this.onItemLayout(index);
    }

    private _processInitialOffset(): void {
        if (this._pendingScrollToOffset) {
            setTimeout(() => {
                if (this._pendingScrollToOffset) {
                    const offset = this._pendingScrollToOffset;
                    this._pendingScrollToOffset = null;
                    if (this.props.isHorizontal) {
                        offset.y = 0;
                    } else {
                        offset.x = 0;
                    }
                    this.scrollToOffset(offset.x, offset.y, false, this._windowCorrectionConfig.applyToInitialOffset);
                    if (this._pendingRenderStack) {
                        this._renderStackWhenReady(this._pendingRenderStack);
                        this._pendingRenderStack = undefined;
                    }
                }
            }, 0);
        }
    }

    private _getContextFromContextProvider(props: RecyclerListViewProps): void {
        if (props.contextProvider) {
            const uniqueKey = props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                const offset = props.contextProvider.get(uniqueKey + Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX);
                if (typeof offset === "number" && offset > 0) {
                    this._initialOffset = offset;
                    if (props.onRecreate) {
                        props.onRecreate({ lastOffset: this._initialOffset });
                    }
                    props.contextProvider.remove(uniqueKey + Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX);
                }
                if (props.forceNonDeterministicRendering) {
                    const cachedLayouts = props.contextProvider.get(uniqueKey + Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX) as string;
                    if (cachedLayouts && typeof cachedLayouts === "string") {
                        this._cachedLayouts = JSON.parse(cachedLayouts).layoutArray;
                        props.contextProvider.remove(uniqueKey + Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX);
                    }
                }
            }
        }
    }

    private _checkAndChangeLayouts(newProps: RecyclerListViewProps, forceFullRender?: boolean): void {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = newProps.dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        this._virtualRenderer.setLayoutProvider(newProps.layoutProvider);
        if (newProps.dataProvider.hasStableIds() && this.props.dataProvider !== newProps.dataProvider) {
            if (newProps.dataProvider.requiresDataChangeHandling()) {
                this._virtualRenderer.handleDataSetChange(newProps.dataProvider);
            } else if (this._virtualRenderer.hasPendingAnimationOptimization()) {
                console.warn(Messages.ANIMATION_ON_PAGINATION); //tslint:disable-line
            }
        }
        if (this.props.layoutProvider !== newProps.layoutProvider || this.props.isHorizontal !== newProps.isHorizontal) {
            //TODO:Talha use old layout manager
            this._virtualRenderer.setLayoutManager(newProps.layoutProvider.createLayoutManager(this._layout, newProps.isHorizontal));
            if (newProps.layoutProvider.shouldRefreshWithAnchoring) {
                this._virtualRenderer.refreshWithAnchor();
            } else {
                this._virtualRenderer.refresh();
            }
            this._refreshViewability();
        } else if (this.props.dataProvider !== newProps.dataProvider) {
            if (newProps.dataProvider.getSize() > this.props.dataProvider.getSize()) {
                this._onEndReachedCalled = false;
            }
            const layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.relayoutFromIndex(newProps.dataProvider.getFirstIndexToProcessInternal(), newProps.dataProvider.getSize());
                this._virtualRenderer.refresh();
            }
        } else if (forceFullRender) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                const cachedLayouts = layoutManager.getLayouts();
                this._virtualRenderer.setLayoutManager(newProps.layoutProvider.createLayoutManager(this._layout, newProps.isHorizontal, cachedLayouts));
                this._refreshViewability();
            }
        } else if (this._relayoutReqIndex >= 0) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                const dataProviderSize = newProps.dataProvider.getSize();
                layoutManager.relayoutFromIndex(Math.min(Math.max(dataProviderSize - 1, 0), this._relayoutReqIndex), dataProviderSize);
                this._relayoutReqIndex = -1;
                this._refreshViewability();
            }
        }
    }

    private _refreshViewability(): void {
        this._virtualRenderer.refresh();
        this._queueStateRefresh();

    }

    private _queueStateRefresh(): void {
        this.refreshRequestDebouncer(() => {
            if (this._isMounted) {
                this.setState((prevState) => {
                    return prevState;
                });
            }
        });
    }

    private _onSizeChanged = (layout: Dimension): void => {
        if (layout.height === 0 || layout.width === 0) {
            if (!this.props.suppressBoundedSizeException) {
                throw new CustomError(RecyclerListViewExceptions.layoutException);
            } else {
                return;
            }
        }
        if (!this.props.canChangeSize && this.props.layoutSize) {
            return;
        }
        const hasHeightChanged = this._layout.height !== layout.height;
        const hasWidthChanged = this._layout.width !== layout.width;
        this._layout.height = layout.height;
        this._layout.width = layout.width;
        if (!this._initComplete) {
            this._initComplete = true;
            this._initTrackers(this.props);
            this._processOnEndReached();
        } else {
            if ((hasHeightChanged && hasWidthChanged) ||
                (hasHeightChanged && this.props.isHorizontal) ||
                (hasWidthChanged && !this.props.isHorizontal)) {
                this._checkAndChangeLayouts(this.props, true);
            } else {
                this._refreshViewability();
            }
        }
    }

    private _initStateIfRequired(stack?: RenderStack): boolean {
        /**
         * this is to ensure that if the component does not has state and not render before
         * we still initialize the state like how we do in constructor.
         * else return false to let the caller to call setState
         * so the component can re-render to the correct stack
         */
        if (!this.state && !this.getHasRenderedOnce()) {
            this.state = {
                internalSnapshot: {},
                renderStack: stack,
            } as S;
            return true;
        }
        return false;
    }

    private _renderStackWhenReady = (stack: RenderStack): void => {
        // TODO: Flickers can further be reduced by setting _pendingScrollToOffset in constructor
        // rather than in _onSizeChanged -> _initTrackers
        if (this._pendingScrollToOffset) {
            this._pendingRenderStack = stack;
            return;
        }
        if (!this._initStateIfRequired(stack)) {
            this.setState(() => {
                return { renderStack: stack };
            });
        }
    }

    private _initTrackers(props: RecyclerListViewProps): void {
        this._assertDependencyPresence(props);
        if (props.onVisibleIndexesChanged) {
            throw new CustomError(RecyclerListViewExceptions.usingOldVisibleIndexesChangedParam);
        }
        if (props.onVisibleIndicesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(props.onVisibleIndicesChanged!);
        }
        this._params = {
            initialOffset: this._initialOffset ? this._initialOffset : props.initialOffset,
            initialRenderIndex: props.initialRenderIndex,
            isHorizontal: props.isHorizontal,
            itemCount: props.dataProvider.getSize(),
            renderAheadOffset: props.renderAheadOffset,
        };
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        const layoutManager = props.layoutProvider.createLayoutManager(this._layout, props.isHorizontal, this._cachedLayouts);
        this._virtualRenderer.setLayoutManager(layoutManager);
        this._virtualRenderer.setLayoutProvider(props.layoutProvider);
        this._virtualRenderer.init();
        const offset = this._virtualRenderer.getInitialOffset();
        const contentDimension = layoutManager.getContentDimension();
        if ((offset.y > 0 && contentDimension.height > this._layout.height) ||
            (offset.x > 0 && contentDimension.width > this._layout.width)) {
            this._pendingScrollToOffset = offset;
            if (!this._initStateIfRequired()) {
                this.setState({});
            }
        } else {
            this._virtualRenderer.startViewabilityTracker(this._getWindowCorrection(offset.x, offset.y, props));
        }
    }

    private _getWindowCorrection(offsetX: number, offsetY: number, props: RecyclerListViewProps): WindowCorrection {
        return (props.applyWindowCorrection && props.applyWindowCorrection(offsetX, offsetY, this._windowCorrectionConfig.value))
                || this._windowCorrectionConfig.value;
    }

    private _assertDependencyPresence(props: RecyclerListViewProps): void {
        if (!props.dataProvider || !props.layoutProvider) {
            throw new CustomError(RecyclerListViewExceptions.unresolvedDependenciesException);
        }
    }

    private _assertType(type: string | number): void {
        if (!type && type !== 0) {
            throw new CustomError(RecyclerListViewExceptions.itemTypeNullException);
        }
    }

    private _dataHasChanged = (row1: any, row2: any): boolean => {
        return this.props.dataProvider.rowHasChanged(row1, row2);
    }

    private _renderRowUsingMeta(itemMeta: RenderStackItem): JSX.Element | null {
        const dataSize = this.props.dataProvider.getSize();
        const dataIndex = itemMeta.dataIndex;
        if (!ObjectUtil.isNullOrUndefined(dataIndex) && dataIndex < dataSize) {
            const itemRect = (this._virtualRenderer.getLayoutManager() as LayoutManager).getLayouts()[dataIndex];
            const data = this.props.dataProvider.getDataForIndex(dataIndex);
            const type = this.props.layoutProvider.getLayoutTypeForIndex(dataIndex);
            const key = this._virtualRenderer.syncAndGetKey(dataIndex);
            const styleOverrides = (this._virtualRenderer.getLayoutManager() as LayoutManager).getStyleOverridesForIndex(dataIndex);
            this._assertType(type);
            if (!this.props.forceNonDeterministicRendering) {
                this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            }
            return (
                <ViewRenderer key={key} data={data}
                    dataHasChanged={this._dataHasChanged}
                    x={itemRect.x}
                    y={itemRect.y}
                    layoutType={type}
                    index={dataIndex}
                    styleOverrides={styleOverrides}
                    layoutProvider={this.props.layoutProvider}
                    forceNonDeterministicRendering={this.props.forceNonDeterministicRendering}
                    isHorizontal={this.props.isHorizontal}
                    onSizeChanged={this._onViewContainerSizeChange}
                    childRenderer={this.props.rowRenderer}
                    height={itemRect.height}
                    width={itemRect.width}
                    itemAnimator={Default.value<ItemAnimator>(this.props.itemAnimator, this._defaultItemAnimator)}
                    extendedState={this.props.extendedState}
                    internalSnapshot={this.state.internalSnapshot}
                    renderItemContainer={this.props.renderItemContainer}
                    onItemLayout={this._onItemLayout}/>
            );
        }
        return null;
    }

    private _onViewContainerSizeChange = (dim: Dimension, index: number): void => {
        //Cannot be null here
        const layoutManager: LayoutManager = this._virtualRenderer.getLayoutManager() as LayoutManager;

        if (this.props.debugHandlers && this.props.debugHandlers.resizeDebugHandler) {
            const itemRect = layoutManager.getLayouts()[index];
            this.props.debugHandlers.resizeDebugHandler.resizeDebug({
                width: itemRect.width,
                height: itemRect.height,
            }, dim, index);
        }

        // Add extra protection for overrideLayout as it can only be called when non-deterministic rendering is used.
        if (this.props.forceNonDeterministicRendering && layoutManager.overrideLayout(index, dim)) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            } else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
            this._queueStateRefresh();
        }
    }

    private _checkExpectedDimensionDiscrepancy(itemRect: Dimension, type: string | number, index: number): void {
        if (this.props.layoutProvider.checkDimensionDiscrepancy(itemRect, type, index)) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            } else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
        }
    }

    private _generateRenderStack(): Array<JSX.Element | null> {
        const renderedItems = [];
        if (this.state) {
            for (const key in this.state.renderStack) {
                if (this.state.renderStack.hasOwnProperty(key)) {
                    renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[key]));
                }
            }
        }
        return renderedItems;
    }

    private _onScroll = (offsetX: number, offsetY: number, rawEvent: ScrollEvent): void => {
        // correction to be positive to shift offset upwards; negative to push offset downwards.
        // extracting the correction value from logical offset and updating offset of virtual renderer.
        this._virtualRenderer.updateOffset(offsetX, offsetY, true, this._getWindowCorrection(offsetX, offsetY, this.props));

        if (this.props.onScroll) {
            this.props.onScroll(rawEvent, offsetX, offsetY);
        }
        this._processOnEndReached();
    }

    private _processOnEndReached(): void {
        if (this.props.onEndReached && this._virtualRenderer) {
            const layout = this._virtualRenderer.getLayoutDimension();
            const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
            if (viewabilityTracker) {
                const windowBound = this.props.isHorizontal ? layout.width - this._layout.width : layout.height - this._layout.height;
                const lastOffset = viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
                const threshold = windowBound - lastOffset;

                const listLength = this.props.isHorizontal ? this._layout.width : this._layout.height;
                const triggerOnEndThresholdRelative = listLength * Default.value<number>(this.props.onEndReachedThresholdRelative, 0);
                const triggerOnEndThreshold = Default.value<number>(this.props.onEndReachedThreshold, 0);

                if (threshold <= triggerOnEndThresholdRelative || threshold <= triggerOnEndThreshold) {
                    if (this.props.onEndReached && !this._onEndReachedCalled) {
                        this._onEndReachedCalled = true;
                        this.props.onEndReached();
                    }
                } else {
                    this._onEndReachedCalled = false;
                }
            }
        }
    }
}

RecyclerListView.propTypes = {

    //Refer the sample
    layoutProvider: PropTypes.instanceOf(BaseLayoutProvider).isRequired,

    //Refer the sample
    dataProvider: PropTypes.instanceOf(BaseDataProvider).isRequired,

    //Used to maintain scroll position in case view gets destroyed e.g, cases of back navigation
    contextProvider: PropTypes.instanceOf(ContextProvider),

    //Methods which returns react component to be rendered. You get type of view and data in the callback.
    rowRenderer: PropTypes.func.isRequired,

    //Initial offset you want to start rendering from, very useful if you want to maintain scroll context across pages.
    initialOffset: PropTypes.number,

    //Specify how many pixels in advance do you want views to be rendered. Increasing this value can help reduce blanks (if any). However keeping this as low
    //as possible should be the intent. Higher values also increase re-render compute
    renderAheadOffset: PropTypes.number,

    //Whether the listview is horizontally scrollable. Both use staggeredGrid implementation
    isHorizontal: PropTypes.bool,

    //On scroll callback onScroll(rawEvent, offsetX, offsetY), note you get offsets no need to read scrollTop/scrollLeft
    onScroll: PropTypes.func,

    //callback onRecreate(params), when recreating recycler view from context provider. Gives you the initial params in the first
    //frame itself to allow you to render content accordingly
    onRecreate: PropTypes.func,

    //Provide your own ScrollView Component. The contract for the scroll event should match the native scroll event contract, i.e.
    // scrollEvent = { nativeEvent: { contentOffset: { x: offset, y: offset } } }
    //Note: Please extend BaseScrollView to achieve expected behaviour
    externalScrollView: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),

    //Callback given when user scrolls to the end of the list or footer just becomes visible, useful in incremental loading scenarios
    onEndReached: PropTypes.func,

    //Specify how many pixels in advance you onEndReached callback
    onEndReachedThreshold: PropTypes.number,

    //Specify how far from the end (in units of visible length of the list)
    //the bottom edge of the list must be from the end of the content to trigger the onEndReached callback
    onEndReachedThresholdRelative: PropTypes.number,

    //Deprecated. Please use onVisibleIndicesChanged instead.
    onVisibleIndexesChanged: PropTypes.func,

    //Provides visible index, helpful in sending impression events etc, onVisibleIndicesChanged(all, now, notNow)
    onVisibleIndicesChanged: PropTypes.func,

    //Provide this method if you want to render a footer. Helpful in showing a loader while doing incremental loads.
    renderFooter: PropTypes.func,

    //Specify the initial item index you want rendering to start from. Preferred over initialOffset if both are specified.
    initialRenderIndex: PropTypes.number,

    //Specify the estimated size of the recyclerlistview to render the list items in the first pass. If provided, recyclerlistview will
    //use these dimensions to fill in the items in the first render. If not provided, recyclerlistview will first render with no items
    //and then fill in the items based on the size given by its onLayout event. canChangeSize can be set to true to relayout items when
    //the size changes.
    layoutSize: PropTypes.object,

    //iOS only. Scroll throttle duration.
    scrollThrottle: PropTypes.number,

    //Specify if size can change, listview will automatically relayout items. For web, works only with useWindowScroll = true
    canChangeSize: PropTypes.bool,

    //Web only. Layout elements in window instead of a scrollable div.
    useWindowScroll: PropTypes.bool,

    //Turns off recycling. You still get progressive rendering and all other features. Good for lazy rendering. This should not be used in most cases.
    disableRecycling: PropTypes.bool,

    //Default is false, if enabled dimensions provided in layout provider will not be strictly enforced.
    //Rendered dimensions will be used to relayout items. Slower if enabled.
    forceNonDeterministicRendering: PropTypes.bool,

    //In some cases the data passed at row level may not contain all the info that the item depends upon, you can keep all other info
    //outside and pass it down via this prop. Changing this object will cause everything to re-render. Make sure you don't change
    //it often to ensure performance. Re-renders are heavy.
    extendedState: PropTypes.object,

    //Enables animating RecyclerListView item cells e.g, shift, add, remove etc. This prop can be used to pass an external item animation implementation.
    //Look into BaseItemAnimator/DefaultJSItemAnimator/DefaultNativeItemAnimator/DefaultWebItemAnimator for more info.
    //By default there are few animations, to disable completely simply pass blank new BaseItemAnimator() object. Remember, create
    //one object and keep it do not create multiple object of type BaseItemAnimator.
    //Note: You might want to look into DefaultNativeItemAnimator to check an implementation based on LayoutAnimation. By default,
    //animations are JS driven to avoid workflow interference. Also, please note LayoutAnimation is buggy on Android.
    itemAnimator: PropTypes.instanceOf(BaseItemAnimator),

    //All of the Recyclerlistview item cells are enclosed inside this item container. The idea is pass a native UI component which implements a
    //view shifting algorithm to remove the overlaps between the neighbouring views. This is achieved by shifting them by the appropriate
    //amount in the correct direction if the estimated sizes of the item cells are not accurate. If this props is passed, it will be used to
    //enclose the list items and otherwise a default react native View will be used for the same.
    renderContentContainer: PropTypes.func,

    //This container is for wrapping individual cells that are being rendered by recyclerlistview unlike contentContainer which wraps all of them.
    renderItemContainer: PropTypes.func,

    //Deprecated in favour of `prepareForLayoutAnimationRender` method
    optimizeForInsertDeleteAnimations: PropTypes.bool,

    //To pass down style to inner ScrollView
    style: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.number,
    ]),
    //For TS use case, not necessary with JS use.
    //For all props that need to be proxied to inner/external scrollview. Put them in an object and they'll be spread
    //and passed down.
    scrollViewProps: PropTypes.object,

    // Used when the logical offsetY differs from actual offsetY of recyclerlistview, could be because some other component is overlaying the recyclerlistview.
    // For e.x. toolbar within CoordinatorLayout are overlapping the recyclerlistview.
    // This method exposes the windowCorrection object of RecyclerListView, user can modify the values in realtime.
    applyWindowCorrection: PropTypes.func,

    // This can be used to hook an itemLayoutListener to listen to which item at what index is layout.
    // To get the layout params of the item, you can use the ref to call method getLayout(index), e.x. : `this._recyclerRef.getLayout(index)`
    // but there is a catch here, since there might be a pending relayout due to which the queried layout might not be precise.
    // Caution: RLV only listens to layout changes if forceNonDeterministicRendering is true
    onItemLayout: PropTypes.func,

    //Used to specify is window correction config and whether it should be applied to some scroll events
    windowCorrectionConfig: PropTypes.object,
};
