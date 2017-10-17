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
import React, {Component} from "react";
import VirtualRenderer from "./VirtualRenderer";
import DataProvider from "./dependencies/DataProvider";
import LayoutProvider from "./dependencies/LayoutProvider";
import LayoutManager from "./layoutmanager/LayoutManager";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import PropTypes from "prop-types";
import ContextProvider from "./dependencies/ContextProvider";
import CustomError from "./exceptions/CustomError";
import Messages from "./messages/Messages";

let ScrollComponent, ViewRenderer;

/***
 * Using webpack plugin definitions to choose the scroll component and view renderer
 * To run in browser specify an extra plugin RLV_ENV: JSON.stringify('browser')
 */
if (process.env.RLV_ENV && process.env.RLV_ENV === 'browser') {
    ScrollComponent = require("./scrollcomponent/web/ScrollComponent").default;
    ViewRenderer = require("./viewrenderer/web/ViewRenderer").default;
} else {
    ScrollComponent = require("./scrollcomponent/reactnative/ScrollComponent").default;
    ViewRenderer = require("./viewrenderer/reactnative/ViewRenderer").default;
}

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
class RecyclerListView extends Component {
    constructor(props) {
        super(props);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
        this._dataHasChanged = this._dataHasChanged.bind(this);
        this.scrollToOffset = this.scrollToOffset.bind(this);
        this._renderStackWhenReady = this._renderStackWhenReady.bind(this);
        this._onViewContainerSizeChange = this._onViewContainerSizeChange.bind(this);
        this._onEndReachedCalled = false;

        this._virtualRenderer = new VirtualRenderer(this._renderStackWhenReady, (offset) => {
            this._pendingScrollToOffset = offset;
        }, !props.disableRecycling);

        this._initComplete = false;
        this._relayoutReqIndex = -1;
        this._params = {};
        this._layout = {height: 0, width: 0};
        this._pendingScrollToOffset = null;
        this._tempDim = {};
        this._initialOffset = 0;
        this._cachedLayouts = null;
        this._nextFrameRenderQueued = false;
        this.state = {
            renderStack: []
        };
    }

    componentWillReceiveProps(newProps) {
        if(!this._initComplete){
            return
        }
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
        if(!this._initComplete){
            return
        }
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
                        let layoutsToCache = this._virtualRenderer.getLayoutManager().getLayouts();
                        if (layoutsToCache) {
                            layoutsToCache = JSON.stringify({layoutArray: layoutsToCache});
                            this.props.contextProvider.save(uniqueKey + "_layouts", layoutsToCache);
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
                if (offset > 0) {
                    this._initialOffset = offset;
                }
                if (this.props.forceNonDeterministicRendering) {
                    let cachedLayouts = this.props.contextProvider.get(uniqueKey + "_layouts");
                    if (cachedLayouts) {
                        cachedLayouts = JSON.parse(cachedLayouts)["layoutArray"];
                        this._cachedLayouts = cachedLayouts;
                    }
                }
                this.props.contextProvider.remove(uniqueKey);
            }
        }
        if(this.props.containerLayout){
            this._onSizeChanged(this.props.containerLayout)
        }
    }

    scrollToIndex(index, animate) {
        if (this._virtualRenderer.getLayoutManager()) {
            let offsets = this._virtualRenderer.getLayoutManager().getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate);
        } else {
            console.warn(Messages.WARN_SCROLL_TO_INDEX);
        }
    }

    scrollToItem(data, animate) {
        let count = this.props.dataProvider.getSize();
        for (let i = 0; i < count; i++) {
            if (this.props.dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    }

    scrollToTop(animate) {
        this.scrollToOffset(0, 0, animate);
    }

    scrollToEnd(animate) {
        let lastIndex = this.props.dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    }

    scrollToOffset(x, y, animate = false) {
        let scrollComponent = this.refs["scrollComponent"];
        if (scrollComponent) {
            scrollComponent.scrollTo(x, y, animate);
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

    _checkAndChangeLayouts(newProps, forceFullRender) {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = newProps.dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        if (forceFullRender || this.props.layoutProvider !== newProps.layoutProvider || this.props.isHorizontal !== newProps.isHorizontal) {
            //TODO:Talha use old layout manager
            this._virtualRenderer.setLayoutManager(new LayoutManager(newProps.layoutProvider, this._layout, newProps.isHorizontal));
            this._virtualRenderer.refreshWithAnchor();
        } else if (this.props.dataProvider !== newProps.dataProvider) {
            this._virtualRenderer.getLayoutManager().reLayoutFromIndex(newProps.dataProvider._firstIndexToProcess, newProps.dataProvider.getSize());
            this._virtualRenderer.refresh();
        } else if (this._relayoutReqIndex >= 0) {
            this._virtualRenderer.getLayoutManager().reLayoutFromIndex(this._relayoutReqIndex, newProps.dataProvider.getSize());
            this._relayoutReqIndex = -1;
            this._refreshViewability();
        }
    }

    _refreshViewability() {
        this._virtualRenderer.refresh();
        this.setState((prevState, props) => {
            return prevState;
        });
    }

    _onSizeChanged(layout) {
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

    _renderStackWhenReady(stack) {
        this.setState((prevState, props) => {
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

    _onVisibleItemsChanged(all, now, notNow) {
        this.props.onVisibleIndexesChanged(all, now, notNow);

    }

    _assertDependencyPresence(props) {
        if (!props.dataProvider || !props.layoutProvider) {
            throw new CustomError(RecyclerListViewExceptions.unresolvedDependenciesException);
        }
    }

    _assertType(type) {
        if (!type && type !== 0) {
            throw new CustomError(RecyclerListViewExceptions.itemTypeNullException);
        }
    }

    _dataHasChanged(row1, row2) {
        return this.props.dataProvider.rowHasChanged(row1, row2);
    }

    _renderRowUsingMeta(itemMeta) {
        let dataSize = this.props.dataProvider.getSize();
        let dataIndex = itemMeta.dataIndex;
        if (dataIndex < dataSize) {
            let itemRect = this._virtualRenderer.getLayoutManager().getLayouts()[dataIndex];
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

    _onViewContainerSizeChange(dim, index) {
        this._virtualRenderer.getLayoutManager().overrideLayout(index, dim);
        if (this._relayoutReqIndex === -1) {
            this._relayoutReqIndex = index;
        } else {
            this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
        }
        if (!this._nextFrameRenderQueued) {
            this._nextFrameRenderQueued = true;
            if (requestAnimationFrame) {
                requestAnimationFrame(() => {
                    this.setState((prevState, props) => {
                        return prevState;
                    });
                    this._nextFrameRenderQueued = false;
                });
            }
            else {
                setTimeout(() => {
                    this.setState((prevState, props) => {
                        return prevState;
                    });
                    this._nextFrameRenderQueued = false;
                }, 17);
            }
        }
    }

    _checkExpectedDimensionDiscrepancy(itemRect, type, index) {
        this._virtualRenderer.getLayoutManager()._setMaxBounds(this._tempDim);
        this.props.layoutProvider.setLayoutForType(type, this._tempDim, index);

        //TODO:Talha calling private method, find an alternative and remove this
        this._virtualRenderer.getLayoutManager()._setMaxBounds(this._tempDim);
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

    _onScroll(offsetX, offsetY, rawEvent) {
        this._virtualRenderer.updateOffset(offsetX, offsetY);
        if (this.props.onScroll) {
            this.props.onScroll(rawEvent, offsetX, offsetY);
        }
        this._processOnEndReached();
    }

    _processOnEndReached() {
        if (this.props.onEndReached && this._virtualRenderer) {
            let layout = this._virtualRenderer.getLayoutDimension();
            let windowBound = this.props.isHorizontal ? layout.width - this._layout.width : layout.height - this._layout.height;
            if (windowBound - this._virtualRenderer.getViewabilityTracker().getLastOffset() <= this.props.onEndReachedThreshold) {
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
            <ScrollComponent ref="scrollComponent"
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

export default RecyclerListView;

RecyclerListView
    .defaultProps = {
    initialOffset: 0,
    isHorizontal: false,
    renderAheadOffset: 250,
    onEndReachedThreshold: 0,
    initialRenderIndex: 0,
    canChangeSize: false,
    disableRecycling: false
};

//#if [DEV]
RecyclerListView
    .propTypes = {

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

    //web/iOS only. Scroll throttle duration.
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
//#endif