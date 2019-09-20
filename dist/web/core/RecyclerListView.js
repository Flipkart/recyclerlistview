"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
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
var debounce = require("lodash.debounce");
var PropTypes = require("prop-types");
var React = require("react");
var ts_object_utils_1 = require("ts-object-utils");
var ContextProvider_1 = require("./dependencies/ContextProvider");
var DataProvider_1 = require("./dependencies/DataProvider");
var LayoutProvider_1 = require("./dependencies/LayoutProvider");
var CustomError_1 = require("./exceptions/CustomError");
var RecyclerListViewExceptions_1 = require("./exceptions/RecyclerListViewExceptions");
var Constants_1 = require("./constants/Constants");
var Messages_1 = require("./constants/Messages");
var VirtualRenderer_1 = require("./VirtualRenderer");
var ItemAnimator_1 = require("./ItemAnimator");
//#if [REACT-NATIVE]
//import ScrollComponent from "../platform/reactnative/scrollcomponent/ScrollComponent";
//import ViewRenderer from "../platform/reactnative/viewrenderer/ViewRenderer";
//import { DefaultJSItemAnimator as DefaultItemAnimator } from "../platform/reactnative/itemanimators/defaultjsanimator/DefaultJSItemAnimator";
//import { Platform } from "react-native";
//const IS_WEB = !Platform || Platform.OS === "web";
//#endif
/***
 * To use on web, start importing from recyclerlistview/web. To make it even easier specify an alias in you builder of choice.
 */
//#if [WEB]
var ScrollComponent_1 = require("../platform/web/scrollcomponent/ScrollComponent");
var ViewRenderer_1 = require("../platform/web/viewrenderer/ViewRenderer");
var DefaultWebItemAnimator_1 = require("../platform/web/itemanimators/DefaultWebItemAnimator");
var IS_WEB = true;
var RecyclerListView = /** @class */ (function (_super) {
    __extends(RecyclerListView, _super);
    function RecyclerListView(props, context) {
        var _this = _super.call(this, props, context) || this;
        _this.refreshRequestDebouncer = debounce(function (executable) {
            executable();
        });
        _this._onEndReachedCalled = false;
        _this._initComplete = false;
        _this._relayoutReqIndex = -1;
        _this._params = {
            initialOffset: 0,
            initialRenderIndex: 0,
            isHorizontal: false,
            itemCount: 0,
            renderAheadOffset: 250,
        };
        _this._layout = { height: 0, width: 0 };
        _this._pendingScrollToOffset = null;
        _this._tempDim = { height: 0, width: 0 };
        _this._initialOffset = 0;
        _this._scrollComponent = null;
        _this._defaultItemAnimator = new DefaultWebItemAnimator_1.DefaultWebItemAnimator();
        _this.scrollToOffset = function (x, y, animate) {
            if (animate === void 0) { animate = false; }
            if (_this._scrollComponent) {
                if (_this.props.isHorizontal) {
                    y = 0;
                }
                else {
                    x = 0;
                }
                _this._scrollComponent.scrollTo(x, y, animate);
            }
        };
        _this._onSizeChanged = function (layout) {
            var hasHeightChanged = _this._layout.height !== layout.height;
            var hasWidthChanged = _this._layout.width !== layout.width;
            _this._layout.height = layout.height;
            _this._layout.width = layout.width;
            if (layout.height === 0 || layout.width === 0) {
                throw new CustomError_1.default(RecyclerListViewExceptions_1.default.layoutException);
            }
            if (!_this._initComplete) {
                _this._initComplete = true;
                _this._initTrackers();
                _this._processOnEndReached();
            }
            else {
                if ((hasHeightChanged && hasWidthChanged) ||
                    (hasHeightChanged && _this.props.isHorizontal) ||
                    (hasWidthChanged && !_this.props.isHorizontal)) {
                    _this._checkAndChangeLayouts(_this.props, true);
                }
                else {
                    _this._refreshViewability();
                }
            }
        };
        _this._renderStackWhenReady = function (stack) {
            _this.setState(function () {
                return { renderStack: stack };
            });
        };
        _this._dataHasChanged = function (row1, row2) {
            return _this.props.dataProvider.rowHasChanged(row1, row2);
        };
        _this._onViewContainerSizeChange = function (dim, index) {
            //Cannot be null here
            var layoutManager = _this._virtualRenderer.getLayoutManager();
            if (_this.props.debugHandlers && _this.props.debugHandlers.resizeDebugHandler) {
                var itemRect = layoutManager.getLayouts()[index];
                _this.props.debugHandlers.resizeDebugHandler.resizeDebug({
                    width: itemRect.width,
                    height: itemRect.height,
                }, dim, index);
            }
            if (layoutManager.overrideLayout(index, dim)) {
                if (_this._relayoutReqIndex === -1) {
                    _this._relayoutReqIndex = index;
                }
                else {
                    _this._relayoutReqIndex = Math.min(_this._relayoutReqIndex, index);
                }
                _this._queueStateRefresh();
            }
        };
        _this._onScroll = function (offsetX, offsetY, rawEvent) {
            //Adjusting offsets using distanceFromWindow
            _this._virtualRenderer.updateOffset(offsetX, offsetY, -_this.props.distanceFromWindow, true);
            if (_this.props.onScroll) {
                _this.props.onScroll(rawEvent, offsetX, offsetY);
            }
            _this._processOnEndReached();
        };
        _this._virtualRenderer = new VirtualRenderer_1.default(_this._renderStackWhenReady, function (offset) {
            _this._pendingScrollToOffset = offset;
        }, function (index) {
            return _this.props.dataProvider.getStableId(index);
        }, !props.disableRecycling);
        _this.state = {
            internalSnapshot: {},
            renderStack: {},
        };
        return _this;
    }
    RecyclerListView.prototype.componentWillReceiveProps = function (newProps) {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!this.props.onVisibleIndicesChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        if (this.props.onVisibleIndexesChanged) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.usingOldVisibleIndexesChangedParam);
        }
        if (this.props.onVisibleIndicesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndicesChanged);
        }
    };
    RecyclerListView.prototype.componentDidUpdate = function () {
        var _this = this;
        if (this._pendingScrollToOffset) {
            var offset_1 = this._pendingScrollToOffset;
            this._pendingScrollToOffset = null;
            if (this.props.isHorizontal) {
                offset_1.y = 0;
            }
            else {
                offset_1.x = 0;
            }
            setTimeout(function () {
                _this.scrollToOffset(offset_1.x, offset_1.y, false);
            }, 0);
        }
        this._processOnEndReached();
        this._checkAndChangeLayouts(this.props);
        if (this.props.dataProvider.getSize() === 0) {
            console.warn(Messages_1.Messages.WARN_NO_DATA); //tslint:disable-line
        }
    };
    RecyclerListView.prototype.componentWillUnmount = function () {
        if (this.props.contextProvider) {
            var uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                this.props.contextProvider.save(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX, this.getCurrentScrollOffset());
                if (this.props.forceNonDeterministicRendering) {
                    if (this._virtualRenderer) {
                        var layoutManager = this._virtualRenderer.getLayoutManager();
                        if (layoutManager) {
                            var layoutsToCache = layoutManager.getLayouts();
                            this.props.contextProvider.save(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX, JSON.stringify({ layoutArray: layoutsToCache }));
                        }
                    }
                }
            }
        }
    };
    RecyclerListView.prototype.componentWillMount = function () {
        if (this.props.contextProvider) {
            var uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                var offset = this.props.contextProvider.get(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX);
                if (typeof offset === "number" && offset > 0) {
                    this._initialOffset = offset;
                    if (this.props.onRecreate) {
                        this.props.onRecreate({ lastOffset: this._initialOffset });
                    }
                    this.props.contextProvider.remove(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_OFFSET_KEY_SUFFIX);
                }
                if (this.props.forceNonDeterministicRendering) {
                    var cachedLayouts = this.props.contextProvider.get(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX);
                    if (cachedLayouts && typeof cachedLayouts === "string") {
                        this._cachedLayouts = JSON.parse(cachedLayouts).layoutArray;
                        this.props.contextProvider.remove(uniqueKey + Constants_1.Constants.CONTEXT_PROVIDER_LAYOUT_KEY_SUFFIX);
                    }
                }
            }
        }
    };
    RecyclerListView.prototype.scrollToIndex = function (index, animate) {
        var layoutManager = this._virtualRenderer.getLayoutManager();
        if (layoutManager) {
            var offsets = layoutManager.getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate);
        }
        else {
            console.warn(Messages_1.Messages.WARN_SCROLL_TO_INDEX); //tslint:disable-line
        }
    };
    RecyclerListView.prototype.scrollToItem = function (data, animate) {
        var count = this.props.dataProvider.getSize();
        for (var i = 0; i < count; i++) {
            if (this.props.dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    };
    RecyclerListView.prototype.getLayout = function (index) {
        var layoutManager = this._virtualRenderer.getLayoutManager();
        return layoutManager ? layoutManager.getLayouts()[index] : undefined;
    };
    RecyclerListView.prototype.scrollToTop = function (animate) {
        this.scrollToOffset(0, 0, animate);
    };
    RecyclerListView.prototype.scrollToEnd = function (animate) {
        var lastIndex = this.props.dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    };
    // You can use requestAnimationFrame callback to change renderAhead in multiple frames to enable advanced progressive
    // rendering when view types are very complex. This method returns a boolean saying if the update was committed. Retry in
    // the next frame if you get a failure (if mount wasn't complete). Value should be greater than or equal to 0;
    // Very useful when you have a page where you need a large renderAheadOffset. Setting it at once will slow down the load and
    // this will help mitigate that.
    RecyclerListView.prototype.updateRenderAheadOffset = function (renderAheadOffset) {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        if (viewabilityTracker) {
            viewabilityTracker.updateRenderAheadOffset(renderAheadOffset);
            return true;
        }
        return false;
    };
    RecyclerListView.prototype.getCurrentRenderAheadOffset = function () {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        if (viewabilityTracker) {
            return viewabilityTracker.getCurrentRenderAheadOffset();
        }
        return this.props.renderAheadOffset;
    };
    RecyclerListView.prototype.getCurrentScrollOffset = function () {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.getLastActualOffset() : 0;
    };
    RecyclerListView.prototype.findApproxFirstVisibleIndex = function () {
        var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.findFirstLogicallyVisibleIndex() : 0;
    };
    RecyclerListView.prototype.getRenderedSize = function () {
        return this._layout;
    };
    RecyclerListView.prototype.getContentDimension = function () {
        return this._virtualRenderer.getLayoutDimension();
    };
    // Force Rerender forcefully to update view renderer. Use this in rare circumstances
    RecyclerListView.prototype.forceRerender = function () {
        this.setState({
            internalSnapshot: {},
        });
    };
    RecyclerListView.prototype.render = function () {
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
        var _this = this;
        return (React.createElement(ScrollComponent_1.default, __assign({ ref: function (scrollComponent) { return _this._scrollComponent = scrollComponent; } }, this.props, this.props.scrollViewProps, { onScroll: this._onScroll, onSizeChanged: this._onSizeChanged, contentHeight: this._initComplete ? this._virtualRenderer.getLayoutDimension().height : 0, contentWidth: this._initComplete ? this._virtualRenderer.getLayoutDimension().width : 0 }), this._generateRenderStack()));
    };
    RecyclerListView.prototype.getVirtualRenderer = function () {
        return this._virtualRenderer;
    };
    RecyclerListView.prototype._checkAndChangeLayouts = function (newProps, forceFullRender) {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = newProps.dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        this._virtualRenderer.setLayoutProvider(newProps.layoutProvider);
        if (newProps.dataProvider.hasStableIds() && this.props.dataProvider !== newProps.dataProvider && newProps.dataProvider.requiresDataChangeHandling()) {
            this._virtualRenderer.handleDataSetChange(newProps.dataProvider, this.props.optimizeForInsertDeleteAnimations);
        }
        if (forceFullRender || this.props.layoutProvider !== newProps.layoutProvider || this.props.isHorizontal !== newProps.isHorizontal) {
            //TODO:Talha use old layout manager
            this._virtualRenderer.setLayoutManager(newProps.layoutProvider.newLayoutManager(this._layout, newProps.isHorizontal));
            if (newProps.layoutProvider.shouldRefreshWithAnchoring) {
                this._virtualRenderer.refreshWithAnchor();
            }
            else {
                this._virtualRenderer.refresh();
            }
            this._refreshViewability();
        }
        else if (this.props.dataProvider !== newProps.dataProvider) {
            if (newProps.dataProvider.getSize() > this.props.dataProvider.getSize()) {
                this._onEndReachedCalled = false;
            }
            var layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.relayoutFromIndex(newProps.dataProvider.getFirstIndexToProcessInternal(), newProps.dataProvider.getSize());
                this._virtualRenderer.refresh();
            }
        }
        else if (this._relayoutReqIndex >= 0) {
            var layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                var dataProviderSize = newProps.dataProvider.getSize();
                layoutManager.relayoutFromIndex(Math.min(Math.max(dataProviderSize - 1, 0), this._relayoutReqIndex), dataProviderSize);
                this._relayoutReqIndex = -1;
                this._refreshViewability();
            }
        }
    };
    RecyclerListView.prototype._refreshViewability = function () {
        this._virtualRenderer.refresh();
        this._queueStateRefresh();
    };
    RecyclerListView.prototype._queueStateRefresh = function () {
        var _this = this;
        this.refreshRequestDebouncer(function () {
            _this.setState(function (prevState) {
                return prevState;
            });
        });
    };
    RecyclerListView.prototype._initTrackers = function () {
        this._assertDependencyPresence(this.props);
        if (this.props.onVisibleIndexesChanged) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.usingOldVisibleIndexesChangedParam);
        }
        if (this.props.onVisibleIndicesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndicesChanged);
        }
        this._params = {
            initialOffset: this._initialOffset ? this._initialOffset : this.props.initialOffset,
            initialRenderIndex: this.props.initialRenderIndex,
            isHorizontal: this.props.isHorizontal,
            itemCount: this.props.dataProvider.getSize(),
            renderAheadOffset: this.props.renderAheadOffset,
        };
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        var layoutManager = this.props.layoutProvider.newLayoutManager(this._layout, this.props.isHorizontal, this._cachedLayouts);
        this._virtualRenderer.setLayoutManager(layoutManager);
        this._virtualRenderer.setLayoutProvider(this.props.layoutProvider);
        this._virtualRenderer.init();
        var offset = this._virtualRenderer.getInitialOffset();
        var contentDimension = layoutManager.getContentDimension();
        if ((offset.y > 0 && contentDimension.height > this._layout.height) ||
            (offset.x > 0 && contentDimension.width > this._layout.width)) {
            this._pendingScrollToOffset = offset;
            this.setState({});
        }
        else {
            this._virtualRenderer.startViewabilityTracker();
        }
    };
    RecyclerListView.prototype._assertDependencyPresence = function (props) {
        if (!props.dataProvider || !props.layoutProvider) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.unresolvedDependenciesException);
        }
    };
    RecyclerListView.prototype._assertType = function (type) {
        if (!type && type !== 0) {
            throw new CustomError_1.default(RecyclerListViewExceptions_1.default.itemTypeNullException);
        }
    };
    RecyclerListView.prototype._renderRowUsingMeta = function (itemMeta) {
        var dataSize = this.props.dataProvider.getSize();
        var dataIndex = itemMeta.dataIndex;
        if (!ts_object_utils_1.ObjectUtil.isNullOrUndefined(dataIndex) && dataIndex < dataSize) {
            var itemRect = this._virtualRenderer.getLayoutManager().getLayouts()[dataIndex];
            var data = this.props.dataProvider.getDataForIndex(dataIndex);
            var type = this.props.layoutProvider.getLayoutTypeForIndex(dataIndex);
            var key = this._virtualRenderer.syncAndGetKey(dataIndex);
            var styleOverrides = this._virtualRenderer.getLayoutManager().getStyleOverridesForIndex(dataIndex);
            this._assertType(type);
            if (!this.props.forceNonDeterministicRendering) {
                this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            }
            return (React.createElement(ViewRenderer_1.default, { key: key, data: data, dataHasChanged: this._dataHasChanged, x: itemRect.x, y: itemRect.y, layoutType: type, index: dataIndex, styleOverrides: styleOverrides, layoutProvider: this.props.layoutProvider, forceNonDeterministicRendering: this.props.forceNonDeterministicRendering, isHorizontal: this.props.isHorizontal, onSizeChanged: this._onViewContainerSizeChange, childRenderer: this.props.rowRenderer, height: itemRect.height, width: itemRect.width, itemAnimator: ts_object_utils_1.Default.value(this.props.itemAnimator, this._defaultItemAnimator), extendedState: this.props.extendedState, internalSnapshot: this.state.internalSnapshot }));
        }
        return null;
    };
    RecyclerListView.prototype._checkExpectedDimensionDiscrepancy = function (itemRect, type, index) {
        if (this.props.layoutProvider.checkDimensionDiscrepancy(itemRect, type, index)) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            }
            else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
        }
    };
    RecyclerListView.prototype._generateRenderStack = function () {
        var renderedItems = [];
        for (var key in this.state.renderStack) {
            if (this.state.renderStack.hasOwnProperty(key)) {
                renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[key]));
            }
        }
        return renderedItems;
    };
    RecyclerListView.prototype._processOnEndReached = function () {
        if (this.props.onEndReached && this._virtualRenderer) {
            var layout = this._virtualRenderer.getLayoutDimension();
            var viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
            if (viewabilityTracker) {
                var windowBound = this.props.isHorizontal ? layout.width - this._layout.width : layout.height - this._layout.height;
                var lastOffset = viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
                if (windowBound - lastOffset <= ts_object_utils_1.Default.value(this.props.onEndReachedThreshold, 0)) {
                    if (this.props.onEndReached && !this._onEndReachedCalled) {
                        this._onEndReachedCalled = true;
                        this.props.onEndReached();
                    }
                }
                else {
                    this._onEndReachedCalled = false;
                }
            }
        }
    };
    RecyclerListView.defaultProps = {
        canChangeSize: false,
        disableRecycling: false,
        initialOffset: 0,
        initialRenderIndex: 0,
        isHorizontal: false,
        onEndReachedThreshold: 0,
        distanceFromWindow: 0,
        renderAheadOffset: IS_WEB ? 1000 : 250,
    };
    RecyclerListView.propTypes = {};
    return RecyclerListView;
}(React.Component));
exports.default = RecyclerListView;
RecyclerListView.propTypes = {
    //Refer the sample
    layoutProvider: PropTypes.instanceOf(LayoutProvider_1.BaseLayoutProvider).isRequired,
    //Refer the sample
    dataProvider: PropTypes.instanceOf(DataProvider_1.BaseDataProvider).isRequired,
    //Used to maintain scroll position in case view gets destroyed e.g, cases of back navigation
    contextProvider: PropTypes.instanceOf(ContextProvider_1.default),
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
    externalScrollView: PropTypes.func,
    //Callback given when user scrolls to the end of the list or footer just becomes visible, useful in incremental loading scenarios
    onEndReached: PropTypes.func,
    //Specify how many pixels in advance you onEndReached callback
    onEndReachedThreshold: PropTypes.number,
    //Deprecated. Please use onVisibleIndicesChanged instead.
    onVisibleIndexesChanged: PropTypes.func,
    //Provides visible index, helpful in sending impression events etc, onVisibleIndicesChanged(all, now, notNow)
    onVisibleIndicesChanged: PropTypes.func,
    //Provide this method if you want to render a footer. Helpful in showing a loader while doing incremental loads.
    renderFooter: PropTypes.func,
    //Specify the initial item index you want rendering to start from. Preferred over initialOffset if both are specified.
    initialRenderIndex: PropTypes.number,
    //iOS only. Scroll throttle duration.
    scrollThrottle: PropTypes.number,
    //Specify if size can change, listview will automatically relayout items. For web, works only with useWindowScroll = true
    canChangeSize: PropTypes.bool,
    //Specify how far away the first list item is from start of the RecyclerListView. e.g, if you have content padding on top or left.
    //This is an adjustment for optimization and to make sure onVisibileIndexesChanged callback is correct.
    //Ideally try to avoid setting large padding values on RLV content. If you have to please correct offsets reported, handle
    //them in a custom ScrollView and pass it as an externalScrollView. If you want this to be accounted in scrollToOffset please
    //override the method and handle manually.
    distanceFromWindow: PropTypes.number,
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
    itemAnimator: PropTypes.instanceOf(ItemAnimator_1.BaseItemAnimator),
    //Enables you to utilize layout animations better by unmounting removed items. Please note, this might increase unmounts
    //on large data changes.
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
};
//# sourceMappingURL=RecyclerListView.js.map