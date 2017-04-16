/***
 * TODO: Reduce layout processing on data insert
 * TODO: Add notify data set changed and notify data insert option in data source
 * DONE: Add on end reached callback
 * DONE: Make another class for render stack generator
 * TODO: Simplify rendering a loading footer
 * TODO: Anchor first visible index on any insert/delete data wise
 * TODO: Build Scroll to index
 * DONE: Give viewability callbacks
 * TODO: Add full render logic in cases like change of dimensions
 * TODO: Fix all proptypes
 * TODO: Add Initial render Index support
 */
import React, {Component} from "react";
import Messages from "./messages/Messages";
import ScrollComponent from "./scrollcomponent/ScrollComponent";
import ViewHolder from "./ViewHolder";
import VirtualRenderer from "./VirtualRenderer";
import DataProvider from "./dependencies/DataProvider";
import LayoutProvider from "./dependencies/LayoutProvider";

class RecyclerListView extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);
        this._onVisibleItemsChanged = this._onVisibleItemsChanged.bind(this);
        this._onEndReachedCalled = false;
        this._virtualRenderer = null;
        this._layout = {height: 0, width: 0};
        this.state = {
            renderStack: []
        };
    }

    componentWillReceiveProps(newProps) {
        this._virtualRenderer.updatePropsAndDimensions(newProps, this._layout);
        if (!this.props.onVisibleItemsChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        else {
            this._virtualRenderer.attachVisibleItemsListener(this._onVisibleItemsChanged);
        }
    }

    componentDidUpdate() {
        this._processOnEndReached();
    }

    scrollToIndex(index) {

    }

    scrollToItem(data) {

    }

    getScrollOffset() {
        let offset = this._virtualRenderer.getViewabilityTracker().getLastOffset();
        let x = this.props.isHorizontal ? offset : 0;
        let y = !this.props.isHorizontal ? offset : 0;
        return {x: x, y: y};
    }

    scrollToOffset(x, y, animate) {
        this.refs["scrollComponent"].scrollTo(x, y, animate);
    }

    _onSizeChanged(layout) {
        this._layout.height = layout.height;
        this._layout.width = layout.width;
        if (layout.height > 0 && layout.width > 0) {
            this._initTrackers();
            this._processOnEndReached();
        }
        else {
            console.error("RecyclerListView needs to have a bounded size. Currently height or, width is 0");
        }
    }

    _initTrackers() {
        this._assertDependencyPresence();
        this._virtualRenderer = new VirtualRenderer((stack) => {
            this.setState((prevState, props) => {
                return {renderStack: stack};
            });
        });
        if (this.props.onVisibleItemsChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this._onVisibleItemsChanged);
        }
        this._virtualRenderer.init(this.props, this._layout);
    }

    _onVisibleItemsChanged(all, now, notNow) {
        this.props.onVisibleItemsChanged(all, now, notNow);

    }

    _assertDependencyPresence() {
        if (!this.props.dataProvider || !this.props.layoutProvider) {
            throw Messages.ERROR_LISTVIEW_VALIDATION;
        }
    }

    _renderRowUsingMeta(itemMeta) {
        let itemRect = itemMeta.itemRect;
        let data = this.props.dataProvider.getDataForIndex(itemMeta.dataIndex);
        //TODO:Talha remove this
        let dataTest = {data: data, key: itemMeta.key};
        let type = itemMeta.type;
        return (
            <ViewHolder key={itemMeta.key} x={itemRect.x} y={itemRect.y} height={itemRect.height}
                        width={itemRect.width}>
                {this.props.rowRenderer(type, dataTest)}
            </ViewHolder>
        );
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
            let windowBound = this.props.isHorizontal ? layout.width - this.props.width : layout.height - this.props.height;
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
                                 onSizeChanged={this._onSizeChanged}
                                 contentHeight={this._virtualRenderer.getLayoutDimension().height}
                                 contentWidth={this._virtualRenderer.getLayoutDimension().width}>
                    {this._generateRenderStack()}
                </ScrollComponent> :
                <ScrollComponent ref="scrollComponent" parentProps={this.props}
                                 onSizeChanged={this._onSizeChanged}></ScrollComponent>

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
};

//#if [DEV]
RecyclerListView
    .propTypes = {
    layoutProvider: React.PropTypes.instanceOf(LayoutProvider).isRequired,
    dataProvider: React.PropTypes.instanceOf(DataProvider).isRequired,
    rowRenderer: React.PropTypes.func.isRequired,
    initialOffset: React.PropTypes.number,
    renderAheadOffset: React.PropTypes.number,
    isHorizontal: React.PropTypes.bool,
    onScroll: React.PropTypes.func,
    onEndReached: React.PropTypes.func,
    onEndReachedThreshold: React.PropTypes.number,
    onVisibleIndexesChanged: React.PropTypes.func
};
//#endif