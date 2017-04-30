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

let ScrollComponent, ViewRenderer;

//TODO: Talha, add documentation
if (process.env.RLV_ENV && process.env.RLV_ENV === 'browser') {
    ScrollComponent = require("./scrollcomponent/web/ScrollComponent").default;
    ViewRenderer = require("./viewrenderer/web/ViewRenderer").default;
} else if (navigator && navigator.product === "ReactNative") {
    ScrollComponent = require("./scrollcomponent/reactnative/ScrollComponent").default;
    ViewRenderer = require("./viewrenderer/reactnative/ViewRenderer").default;
}
else {
    throw RecyclerListViewExceptions.platformNotDetectedException;
}

class RecyclerListView extends Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
        this._dataHasChanged = this._dataHasChanged.bind(this);
        this.scrollToOffset = this.scrollToOffset.bind(this);
        this._onEndReachedCalled = false;
        this._virtualRenderer = null;
        this._initComplete = false;
        this._relayoutReqIndex = -1;
        this._params = {};
        this._layout = {height: 0, width: 0};
        this._pendingScrollToOffset = null;
        this._tempDim = {};
        this.state = {
            renderStack: []
        };
    }

    componentWillReceiveProps(newProps) {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!this.props.onVisibleItemsChanged) {
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

    scrollToIndex(index, animate) {
        let offsets = this._virtualRenderer.getLayoutManager().getOffsetForIndex(index);
        this.scrollToOffset(offsets.x, offsets.y, animate);
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
        this.refs["scrollComponent"].scrollTo(x, y, animate);
    }

    getCurrentScrollOffset() {
        let offset = this._virtualRenderer.getViewabilityTracker().getLastOffset();
        return this.props.isHorizontal ? offset.x : offset.y;
    }

    findApproxFirstVisibleIndex() {
        return this._virtualRenderer.getViewabilityTracker().findFirstLogicallyVisibleIndex();
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
            throw RecyclerListViewExceptions.layoutException;
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

    _initTrackers() {
        this._assertDependencyPresence(this.props);
        this._virtualRenderer = new VirtualRenderer((stack) => {
            this.setState((prevState, props) => {
                return {renderStack: stack};
            });
        }, (offset) => {
            this._pendingScrollToOffset = offset;
        });
        if (this.props.onVisibleItemsChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this._onVisibleItemsChanged);
        }
        this._virtualRenderer.setParamsAndDimensions({
            isHorizontal: this.props.isHorizontal,
            itemCount: this.props.dataProvider.getSize(),
            initialOffset: this.props.initialOffset,
            renderAheadOffset: this.props.renderAheadOffset,
            initialRenderIndex: this.props.initialRenderIndex
        }, this._layout);
        this._virtualRenderer.setLayoutManager(new LayoutManager(this.props.layoutProvider, this._layout, this.props.isHorizontal));
        this._virtualRenderer.setLayoutProvider(this.props.layoutProvider);
        this._virtualRenderer.init();
    }

    _onVisibleItemsChanged(all, now, notNow) {
        this.props.onVisibleItemsChanged(all, now, notNow);

    }

    _assertDependencyPresence(props) {
        if (!props.dataProvider || !props.layoutProvider) {
            throw RecyclerListViewExceptions.unresolvedDependenciesException;
        }
    }

    _assertType(type) {
        if (!type && type !== 0) {
            throw RecyclerListViewExceptions.itemTypeNullException;
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
            this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            return (
                <ViewRenderer key={itemMeta.key} data={data}
                              dataHasChanged={this._dataHasChanged}
                              x={itemRect.x}
                              y={itemRect.y}
                              layoutType={type}
                              index={dataIndex}
                              childRenderer={this.props.rowRenderer}
                              height={itemRect.height}
                              width={itemRect.width}/>
            );
        }
        return null;
    }

    _checkExpectedDimensionDiscrepancy(itemRect, type, index) {
        this.props.layoutProvider.setLayoutForType(type, this._tempDim);

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
        let count = this.state.renderStack.length;
        let renderedItems = [];
        for (let i = 0; i < count; i++) {
            renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[i]));
        }
        return renderedItems;
    }

    _onScroll(offsetX, offsetY, rawEvent) {
        this._virtualRenderer.updateOffset(offsetX, offsetY);
        if (this.props.onScroll) {
            this.props.onScroll(rawEvent);
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
            this._virtualRenderer ?
                <ScrollComponent ref="scrollComponent" initialOffset={this.props.initialOffset} parentProps={this.props}
                                 onScroll={this._onScroll} isHorizontal={this.props.isHorizontal}
                                 onSizeChanged={this._onSizeChanged} renderFooter={this.props.renderFooter}
                                 contentHeight={this._virtualRenderer.getLayoutDimension().height}
                                 scrollThrottle={this.props.scrollThrottle}
                                 canChangeSize={this.props.canChangeSize}
                                 contentWidth={this._virtualRenderer.getLayoutDimension().width}>
                    {this._generateRenderStack()}
                </ScrollComponent> :
                <ScrollComponent ref="scrollComponent" parentProps={this.props}
                                 onSizeChanged={this._onSizeChanged}/>

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
    canChangeSize: false
};

//#if [DEV]
RecyclerListView
    .propTypes = {
    layoutProvider: PropTypes.instanceOf(LayoutProvider).isRequired,
    dataProvider: PropTypes.instanceOf(DataProvider).isRequired,
    rowRenderer: PropTypes.func.isRequired,
    initialOffset: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    isHorizontal: PropTypes.bool,
    onScroll: PropTypes.func,
    onEndReached: PropTypes.func,
    onEndReachedThreshold: PropTypes.number,
    onVisibleIndexesChanged: PropTypes.func,
    renderFooter: PropTypes.func,
    initialRenderIndex: PropTypes.number,
    scrollThrottle: PropTypes.number,
    canChangeSize: PropTypes.bool
};
//#endif