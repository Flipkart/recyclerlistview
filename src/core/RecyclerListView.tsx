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
 * TODO: Destroy less frequently used items in recycle pool, this will help in case of too many types.
 * TODO: Add animated scroll to web scrollviewer
 * TODO: Animate list view transition, including add/remove
 * TODO: Implement sticky headers
 * TODO: Make viewability callbacks configurable
 * TODO: Observe size changes on web to optimize for reflowability
 */
import * as React from "react";
import VirtualRenderer, { RenderStack, RenderStackItem, RenderStackParams } from "./VirtualRenderer";
import DataProvider from "./dependencies/DataProvider";
import LayoutProvider, { Dimension } from "./dependencies/LayoutProvider";
import LayoutManager, { Point, Rect } from "./layoutmanager/LayoutManager";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import * as PropTypes from "prop-types";
import ContextProvider from "./dependencies/ContextProvider";
import CustomError from "./exceptions/CustomError";
import Messages from "./messages/Messages";
import BaseScrollComponent from "./scrollcomponent/BaseScrollComponent";
import { TOnItemStatusChanged } from "./ViewabilityTracker";
import { ScrollEvent } from "./scrollcomponent/BaseScrollView";

//#if [REACT-NATIVE]
import ScrollComponent from "./scrollcomponent/reactnative/ScrollComponent";
import ViewRenderer from "./viewrenderer/reactnative/ViewRenderer";
//#endif

//#if [WEB]
//import ScrollComponent from "./scrollcomponent/web/ScrollComponent";
//import ViewRenderer from "./viewrenderer/web/ViewRenderer";
//#endif

let _debounce = require("lodash/debounce");

// let ScrollComponent;
// let ViewRenderer;

let refreshRequestDebouncer = _debounce((executable: ()=> void) => {
    executable();
});

/***
 * Using webpack plugin definitions to choose the scroll component and view renderer
 * To run in browser specify an extra plugin RLV_ENV: JSON.stringify('browser')
 * Alternatively, you can start importing from recyclerlistview/web
 */
//#if [REACT-NATIVE]
// if ((process as any).env.RLV_ENV && (process as any).env.RLV_ENV === 'browser') {
//     ScrollComponent = require("./scrollcomponent/web/ScrollComponent");
//     ViewRenderer = require("./viewrenderer/web/ViewRenderer");
// } else {
//     ScrollComponent = require("./scrollcomponent/reactnative/ScrollComponent");
//     ViewRenderer = require("./viewrenderer/reactnative/ViewRenderer");
// }
//#endif

//#if [WEB]
// ScrollComponent = require("./scrollcomponent/web/ScrollComponent").default;
// ViewRenderer = require("./viewrenderer/web/ViewRenderer").default;
//#endif

/***
 * This is the main component, please refer to samples to understand how to use.
 * For advanced usage check out prop descriptions below.
 * You also get common methods such as: scrollToIndex, scrollToItem, scrollToTop, scrollToEnd, scrollToOffset, getCurrentScrollOffset, findApproxFirstVisibleIndex
 * You'll need a ref to Recycler in order to call these
 * Needs to have bounded size in all cases other than window scrolling (web).
 *
 * NOTE: React Native implementation uses ScrollView internally which means you get all ScrollView features as well such as Pull To Refresh, paging enabled
 *       You can easily create a recycling image flip view using one paging enabled flag. Read about ScrollView features in official react native documentation.
 * NOTE: If you see blank space look at the renderAheadOffset prop and make sure your data provider has a good enough rowHasChanged method.
 *       Blanks are totally avoidable with this listview.
 * NOTE: Also works on web (experimental)
 * NOTE: For reflowability set canChangeSize to true (experimental)
 */

export interface RecyclerListViewProps {
    layoutProvider: LayoutProvider,
    dataProvider: DataProvider<any>,
    contextProvider: ContextProvider,
    rowRenderer: (type: string | number, data: any, index: number)=> JSX.Element,
    renderAheadOffset: number,
    isHorizontal: boolean,
    onScroll: (rawEvent:ScrollEvent, offsetX: number, offsetY: number)=>void,
    onEndReached: ()=>void,
    onEndReachedThreshold: number,
    onVisibleIndexesChanged: TOnItemStatusChanged,
    renderFooter: ()=>JSX.Element,
    initialOffset: number,
    initialRenderIndex: number,
    scrollThrottle: number,
    canChangeSize: boolean,
    distanceFromWindow: number,
    useWindowScroll: boolean,
    disableRecycling: boolean,
    forceNonDeterministicRendering: boolean
};
export interface RecyclerListViewState{
    renderStack: RenderStack
}

export default class RecyclerListView extends React.Component<RecyclerListViewProps, RecyclerListViewState> {
    static defaultProps = {
        initialOffset: 0,
        isHorizontal: false,
        renderAheadOffset: 250,
        onEndReachedThreshold: 0,
        initialRenderIndex: 0,
        canChangeSize: false,
        disableRecycling: false
    };

    static propTypes = {};

    private _onEndReachedCalled = false;

    private _virtualRenderer: VirtualRenderer;

    private _initComplete = false;
    private _relayoutReqIndex: number = -1;
    private _params: RenderStackParams = {
        isHorizontal: false,
        itemCount: 0,
        initialOffset: 0,
        initialRenderIndex: 0,
        renderAheadOffset: 250
    };
    private _layout: Dimension = {height: 0, width: 0};
    private _pendingScrollToOffset: Point | null = null;
    private _tempDim: Dimension = { height :0, width : 0};
    private _initialOffset = 0;
    private _cachedLayouts: Rect[] | null = null;
    private _scrollComponent: BaseScrollComponent | null;

    constructor(props: RecyclerListViewProps) {
        super(props);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
        this._dataHasChanged = this._dataHasChanged.bind(this);
        this.scrollToOffset = this.scrollToOffset.bind(this);
        this._renderStackWhenReady = this._renderStackWhenReady.bind(this);
        this._onViewContainerSizeChange = this._onViewContainerSizeChange.bind(this);

        this._virtualRenderer = new VirtualRenderer(this._renderStackWhenReady, (offset) => {
            this._pendingScrollToOffset = offset;
        }, !props.disableRecycling);

        this.state = {
            renderStack: {}
        };
    }

    componentWillReceiveProps(newProps: RecyclerListViewProps) {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        else {
            this._virtualRenderer.attachVisibleItemsListener(this._onVisibleItemsChanged);
        }
    }


    componentDidUpdate() {
        if (this._pendingScrollToOffset) {
            let offset = this._pendingScrollToOffset;
            this._pendingScrollToOffset = null;
            if (this.props.isHorizontal) {
                offset.y = 0;
            } else {
                offset.x = 0;
            }
            setTimeout(() => {
                this.scrollToOffset(offset.x, offset.y, false);
            }, 0);
        }
        this._processOnEndReached();
        this._checkAndChangeLayouts(this.props);
    }

    componentWillUnmount() {
        if (this.props.contextProvider) {
            let uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                this.props.contextProvider.save(uniqueKey, this.getCurrentScrollOffset());
                if (this.props.forceNonDeterministicRendering) {
                    if (this._virtualRenderer) {
                        let layoutManager = this._virtualRenderer.getLayoutManager();
                        if (layoutManager) {
                            let layoutsToCache = layoutManager.getLayouts();
                            this.props.contextProvider.save(uniqueKey + "_layouts", JSON.stringify({layoutArray: layoutsToCache}));
                        }
                    }
                }
            }
        }
    }

    componentWillMount() {
        if (this.props.contextProvider) {
            let uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                let offset = this.props.contextProvider.get(uniqueKey);
                if (typeof offset === "number" && offset > 0) {
                    this._initialOffset = offset;
                }
                if (this.props.forceNonDeterministicRendering) {
                    let cachedLayouts = this.props.contextProvider.get(uniqueKey + "_layouts") as string;
                    if (cachedLayouts && typeof cachedLayouts === "string") {
                        this._cachedLayouts = JSON.parse(cachedLayouts)["layoutArray"];
                    }
                }
                this.props.contextProvider.remove(uniqueKey);
            }
        }
    }

    scrollToIndex(index: number, animate?: boolean) {
        let layoutManager = this._virtualRenderer.getLayoutManager();
        if (layoutManager) {
            let offsets = layoutManager.getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate);
        } else {
            console.warn(Messages.WARN_SCROLL_TO_INDEX);
        }
    }

    scrollToItem(data: any, animate?: boolean) {
        let count = this.props.dataProvider.getSize();
        for (let i = 0; i < count; i++) {
            if (this.props.dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    }

    scrollToTop(animate?: boolean) {
        this.scrollToOffset(0, 0, animate);
    }

    scrollToEnd(animate?: boolean) {
        let lastIndex = this.props.dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    }

    scrollToOffset(x: number, y: number, animate: boolean = false) {
        if (this._scrollComponent) {
            this._scrollComponent.scrollTo(x, y, animate);
        }
    }

    getCurrentScrollOffset() {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
    }

    findApproxFirstVisibleIndex() {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.findFirstLogicallyVisibleIndex() : 0;
    }

    _checkAndChangeLayouts(newProps: RecyclerListViewProps, forceFullRender?: boolean) {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = newProps.dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        if (forceFullRender || this.props.layoutProvider !== newProps.layoutProvider || this.props.isHorizontal !== newProps.isHorizontal) {
            //TODO:Talha use old layout manager
            this._virtualRenderer.setLayoutManager(new LayoutManager(newProps.layoutProvider, this._layout, newProps.isHorizontal, null));
            this._virtualRenderer.refreshWithAnchor();
        } else if (this.props.dataProvider !== newProps.dataProvider) {
            let layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(newProps.dataProvider.getFirstIndexToProcessInternal(), newProps.dataProvider.getSize());
                this._virtualRenderer.refresh();
            }
        } else if (this._relayoutReqIndex >= 0) {
            let layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(this._relayoutReqIndex, newProps.dataProvider.getSize());
                this._relayoutReqIndex = -1;
                this._refreshViewability();
            }
        }
    }

    _refreshViewability() {
        this._virtualRenderer.refresh();
        this._queueStateRefresh();

    }

    _queueStateRefresh() {
        refreshRequestDebouncer(() => {
            this.setState((prevState) => {
                return prevState;
            });
        });
    }

    _onSizeChanged(layout: Dimension) {
        let hasHeightChanged = this._layout.height !== layout.height;
        let hasWidthChanged = this._layout.width !== layout.width;
        this._layout.height = layout.height;
        this._layout.width = layout.width;
        if (layout.height === 0 || layout.width === 0) {
            throw new CustomError(RecyclerListViewExceptions.layoutException);
        }
        if (!this._initComplete) {
            this._initComplete = true;
            this._initTrackers();
            this._processOnEndReached();
        }
        else {
            if ((hasHeightChanged && hasWidthChanged) ||
                (hasHeightChanged && this.props.isHorizontal) ||
                (hasWidthChanged && !this.props.isHorizontal)) {
                this._checkAndChangeLayouts(this.props, true);
            } else {
                this._refreshViewability();
            }
        }
    }

    _renderStackWhenReady(stack: RenderStack) {
        this.setState(() => {
            return {renderStack: stack};
        });
    }

    _initTrackers() {
        this._assertDependencyPresence(this.props);
        if (this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this._onVisibleItemsChanged);
        }
        this._params = {
            isHorizontal: this.props.isHorizontal,
            itemCount: this.props.dataProvider.getSize(),
            initialOffset: this.props.initialOffset ? this.props.initialOffset : this._initialOffset,
            renderAheadOffset: this.props.renderAheadOffset,
            initialRenderIndex: this.props.initialRenderIndex
        };
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        this._virtualRenderer.setLayoutManager(new LayoutManager(this.props.layoutProvider, this._layout, this.props.isHorizontal, this._cachedLayouts));
        this._virtualRenderer.setLayoutProvider(this.props.layoutProvider);
        this._virtualRenderer.init();
        let offset = this._virtualRenderer.getInitialOffset();
        if (offset.y > 0 || offset.x > 0) {
            this._pendingScrollToOffset = offset;
            this.setState({});
        }
        else {
            this._virtualRenderer.startViewabilityTracker();
        }
        this._cachedLayouts = null;
    }

    _onVisibleItemsChanged(all: number[], now: number[], notNow: number[]) {
        this.props.onVisibleIndexesChanged(all, now, notNow);

    }

    _assertDependencyPresence(props: RecyclerListViewProps) {
        if (!props.dataProvider || !props.layoutProvider) {
            throw new CustomError(RecyclerListViewExceptions.unresolvedDependenciesException);
        }
    }

    _assertType(type: string | number) {
        if (!type && type !== 0) {
            throw new CustomError(RecyclerListViewExceptions.itemTypeNullException);
        }
    }

    _dataHasChanged(row1: any, row2: any) {
        return this.props.dataProvider.rowHasChanged(row1, row2);
    }

    _renderRowUsingMeta(itemMeta: RenderStackItem): JSX.Element | null {
        let dataSize = this.props.dataProvider.getSize();
        let dataIndex = itemMeta.dataIndex;
        if (dataIndex && dataIndex < dataSize) {
            let itemRect = (this._virtualRenderer.getLayoutManager() as LayoutManager).getLayouts()[dataIndex];
            let data = this.props.dataProvider.getDataForIndex(dataIndex);
            let type = this.props.layoutProvider.getLayoutTypeForIndex(dataIndex);
            this._assertType(type);
            if (!this.props.forceNonDeterministicRendering) {
                this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            }
            return (
                <ViewRenderer key={itemMeta.key} data={data}
                              dataHasChanged={this._dataHasChanged}
                              x={itemRect.x}
                              y={itemRect.y}
                              layoutType={type}
                              index={dataIndex}
                              forceNonDeterministicRendering={this.props.forceNonDeterministicRendering}
                              isHorizontal={this.props.isHorizontal}
                              onSizeChanged={this._onViewContainerSizeChange}
                              childRenderer={this.props.rowRenderer}
                              height={itemRect.height}
                              width={itemRect.width}/>
            );
        }
        return null;
    }

    _onViewContainerSizeChange(dim: Dimension, index: number) {
        //Cannot be null here
        (this._virtualRenderer.getLayoutManager() as LayoutManager).overrideLayout(index, dim);
        if (this._relayoutReqIndex === -1) {
            this._relayoutReqIndex = index;
        } else {
            this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
        }
        this._queueStateRefresh();
    }

    _checkExpectedDimensionDiscrepancy(itemRect: Dimension, type: string | number, index: number) {
        //Cannot be null here
        let layoutManager = this._virtualRenderer.getLayoutManager() as LayoutManager;
        layoutManager._setMaxBounds(this._tempDim);
        this.props.layoutProvider.setLayoutForType(type, this._tempDim, index);

        //TODO:Talha calling private method, find an alternative and remove this
        layoutManager._setMaxBounds(this._tempDim);
        if (itemRect.height !== this._tempDim.height || itemRect.width !== this._tempDim.width) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            } else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
        }
    }

    _generateRenderStack() {
        let renderedItems = [];
        for (let key in this.state.renderStack) {
            if (this.state.renderStack.hasOwnProperty(key)) {
                renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[key]));

            }
        }
        return renderedItems;
    }

    _onScroll(offsetX: number, offsetY: number, rawEvent: ScrollEvent) {
        this._virtualRenderer.updateOffset(offsetX, offsetY);
        if (this.props.onScroll) {
            this.props.onScroll(rawEvent, offsetX, offsetY);
        }
        this._processOnEndReached();
    }

    _processOnEndReached() {
        if (this.props.onEndReached && this._virtualRenderer) {
            const layout = this._virtualRenderer.getLayoutDimension();
            const windowBound = this.props.isHorizontal ? layout.width - this._layout.width : layout.height - this._layout.height;
            const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
            const lastOffset = viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
            if (windowBound - lastOffset <= this.props.onEndReachedThreshold) {
                if (!this._onEndReachedCalled) {
                    this._onEndReachedCalled = true;
                    this.props.onEndReached();
                }
            }
            else {
                this._onEndReachedCalled = false;
            }
        }
    }


    render() {
        return (
            <ScrollComponent
                ref={(scrollComponent: BaseScrollComponent) => this._scrollComponent = scrollComponent as BaseScrollComponent | null}
                {...this.props}
                onScroll={this._onScroll}
                onSizeChanged={this._onSizeChanged}
                contentHeight={this._initComplete ? this._virtualRenderer.getLayoutDimension().height : null}
                contentWidth={this._initComplete ? this._virtualRenderer.getLayoutDimension().width : null}>
                {this._generateRenderStack()}
            </ScrollComponent>

        );
    }
}


RecyclerListView.propTypes = {

    //Refer the sample
    layoutProvider: PropTypes.instanceOf(LayoutProvider).isRequired,

    //Refer the sample
    dataProvider: PropTypes.instanceOf(DataProvider).isRequired,

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

    //Callback given when user scrolls to the end of the list or footer just becomes visible, useful in incremental loading scenarios
    onEndReached: PropTypes.func,

    //Specify how many pixels in advance you onEndReached callback
    onEndReachedThreshold: PropTypes.number,

    //Provides visible index, helpful in sending impression events etc, onVisibleIndexesChanged(all, now, notNow)
    onVisibleIndexesChanged: PropTypes.func,

    //Provide this method if you want to render a footer. Helpful in showing a loader while doing incremental loads.
    renderFooter: PropTypes.func,

    //Specify the initial item index you want rendering to start from. Preferred over initialOffset if both are specified.
    initialRenderIndex: PropTypes.number,

    //iOS only. Scroll throttle duration.
    scrollThrottle: PropTypes.number,

    //Specify if size can change, listview will automatically relayout items. For web, works only with useWindowScroll = true
    canChangeSize: PropTypes.bool,

    //Web only. Specify how far away the first list item is from window top. This is an adjustment for better optimization.
    distanceFromWindow: PropTypes.number,

    //Web only. Layout elements in window instead of a scrollable div.
    useWindowScroll: PropTypes.bool,

    //Turns off recycling. You still get progressive rendering and all other features. Good for lazy rendering. This should not be used in most cases.
    disableRecycling: PropTypes.bool,

    //Default is false, if enabled dimensions provided in layout provider will not be strictly enforced. Rendered dimensions will be used to relayout items. Slower if enabled.
    forceNonDeterministicRendering: PropTypes.bool
};