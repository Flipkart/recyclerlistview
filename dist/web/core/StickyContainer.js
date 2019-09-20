"use strict";
/**
 * Created by ananya.chandra on 14/09/18.
 */
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
var React = require("react");
var PropTypes = require("prop-types");
var react_native_1 = require("react-native");
var StickyHeader_1 = require("./sticky/StickyHeader");
var StickyFooter_1 = require("./sticky/StickyFooter");
var CustomError_1 = require("./exceptions/CustomError");
var RecyclerListViewExceptions_1 = require("./exceptions/RecyclerListViewExceptions");
var StickyContainer = /** @class */ (function (_super) {
    __extends(StickyContainer, _super);
    function StickyContainer(props, context) {
        var _this = _super.call(this, props, context) || this;
        _this._recyclerRef = undefined;
        _this._stickyHeaderRef = null;
        _this._stickyFooterRef = null;
        _this._visibleIndicesAll = [];
        _this._getRecyclerRef = function (recycler) {
            _this._recyclerRef = recycler;
            if (_this.props.children.ref) {
                if (typeof _this.props.children.ref === "function") {
                    (_this.props.children).ref(recycler);
                }
                else {
                    throw new CustomError_1.default(RecyclerListViewExceptions_1.default.refNotAsFunctionException);
                }
            }
        };
        _this._getStickyHeaderRef = function (stickyHeaderRef) {
            if (_this._stickyHeaderRef !== stickyHeaderRef) {
                _this._stickyHeaderRef = stickyHeaderRef;
                // TODO: Resetting state once ref is initialized. Can look for better solution.
                _this._callStickyObjectsOnVisibleIndicesChanged(_this._visibleIndicesAll);
            }
        };
        _this._getStickyFooterRef = function (stickyFooterRef) {
            if (_this._stickyFooterRef !== stickyFooterRef) {
                _this._stickyFooterRef = stickyFooterRef;
                // TODO: Resetting state once ref is initialized. Can look for better solution.
                _this._callStickyObjectsOnVisibleIndicesChanged(_this._visibleIndicesAll);
            }
        };
        _this._onVisibleIndicesChanged = function (all, now, notNow) {
            _this._visibleIndicesAll = all;
            _this._callStickyObjectsOnVisibleIndicesChanged(all);
            if (_this.props.children && _this.props.children.props && _this.props.children.props.onVisibleIndicesChanged) {
                _this.props.children.props.onVisibleIndicesChanged(all, now, notNow);
            }
        };
        _this._callStickyObjectsOnVisibleIndicesChanged = function (all) {
            if (_this._stickyHeaderRef) {
                _this._stickyHeaderRef.onVisibleIndicesChanged(all);
            }
            if (_this._stickyFooterRef) {
                _this._stickyFooterRef.onVisibleIndicesChanged(all);
            }
        };
        _this._onScroll = function (rawEvent, offsetX, offsetY) {
            if (_this._stickyHeaderRef) {
                _this._stickyHeaderRef.onScroll(offsetY);
            }
            if (_this._stickyFooterRef) {
                _this._stickyFooterRef.onScroll(offsetY);
            }
            if (_this.props.children && _this.props.children.props.onScroll) {
                _this.props.children.props.onScroll(rawEvent, offsetX, offsetY);
            }
        };
        _this._assertChildType = function () {
            if (React.Children.count(_this.props.children) !== 1 || !_this._isChildRecyclerInstance()) {
                throw new CustomError_1.default(RecyclerListViewExceptions_1.default.wrongStickyChildTypeException);
            }
        };
        _this._isChildRecyclerInstance = function () {
            return (_this.props.children.props.dataProvider
                && _this.props.children.props.rowRenderer
                && _this.props.children.props.layoutProvider);
        };
        _this._getLayoutForIndex = function (index) {
            if (_this._recyclerRef) {
                return _this._recyclerRef.getLayout(index);
            }
            return undefined;
        };
        _this._getDataForIndex = function (index) {
            return _this._dataProvider.getDataForIndex(index);
        };
        _this._getLayoutTypeForIndex = function (index) {
            return _this._layoutProvider.getLayoutTypeForIndex(index);
        };
        _this._getExtendedState = function () {
            return _this._extendedState;
        };
        _this._getRowRenderer = function () {
            return _this._rowRenderer;
        };
        _this._getRLVRenderedSize = function () {
            if (_this._recyclerRef) {
                return _this._recyclerRef.getRenderedSize();
            }
            return undefined;
        };
        _this._getContentDimension = function () {
            if (_this._recyclerRef) {
                return _this._recyclerRef.getContentDimension();
            }
            return undefined;
        };
        _this._getDistanceFromWindow = function () {
            return _this._distanceFromWindow;
        };
        _this._initParams = function (props) {
            var childProps = props.children.props;
            _this._dataProvider = childProps.dataProvider;
            _this._layoutProvider = childProps.layoutProvider;
            _this._extendedState = childProps.extendedState;
            _this._rowRenderer = childProps.rowRenderer;
            _this._distanceFromWindow = childProps.distanceFromWindow ? childProps.distanceFromWindow : 0;
        };
        _this._assertChildType();
        var childProps = props.children.props;
        _this._dataProvider = childProps.dataProvider;
        _this._layoutProvider = childProps.layoutProvider;
        _this._extendedState = childProps.extendedState;
        _this._rowRenderer = childProps.rowRenderer;
        _this._distanceFromWindow = childProps.distanceFromWindow ? childProps.distanceFromWindow : 0;
        return _this;
    }
    StickyContainer.prototype.componentWillReceiveProps = function (newProps) {
        this._initParams(newProps);
    };
    StickyContainer.prototype.render = function () {
        var _this = this;
        this._assertChildType();
        var recycler = React.cloneElement(this.props.children, __assign({}, this.props.children.props, { ref: this._getRecyclerRef, onVisibleIndicesChanged: this._onVisibleIndicesChanged, onScroll: this._onScroll }));
        return (React.createElement(react_native_1.View, { style: this.props.style ? this.props.style : { flex: 1 } },
            recycler,
            this.props.stickyHeaderIndices ? (React.createElement(StickyHeader_1.default, { ref: function (stickyHeaderRef) { return _this._getStickyHeaderRef(stickyHeaderRef); }, stickyIndices: this.props.stickyHeaderIndices, getLayoutForIndex: this._getLayoutForIndex, getDataForIndex: this._getDataForIndex, getLayoutTypeForIndex: this._getLayoutTypeForIndex, getExtendedState: this._getExtendedState, getRLVRenderedSize: this._getRLVRenderedSize, getContentDimension: this._getContentDimension, getRowRenderer: this._getRowRenderer, getDistanceFromWindow: this._getDistanceFromWindow, overrideRowRenderer: this.props.overrideRowRenderer })) : null,
            this.props.stickyFooterIndices ? (React.createElement(StickyFooter_1.default, { ref: function (stickyFooterRef) { return _this._getStickyFooterRef(stickyFooterRef); }, stickyIndices: this.props.stickyFooterIndices, getLayoutForIndex: this._getLayoutForIndex, getDataForIndex: this._getDataForIndex, getLayoutTypeForIndex: this._getLayoutTypeForIndex, getExtendedState: this._getExtendedState, getRLVRenderedSize: this._getRLVRenderedSize, getContentDimension: this._getContentDimension, getRowRenderer: this._getRowRenderer, getDistanceFromWindow: this._getDistanceFromWindow, overrideRowRenderer: this.props.overrideRowRenderer })) : null));
    };
    StickyContainer.propTypes = {};
    return StickyContainer;
}(React.Component));
exports.default = StickyContainer;
StickyContainer.propTypes = {
    // Mandatory to pass a single child of RecyclerListView or any of its children classes. Exception will be thrown otherwise.
    children: PropTypes.element.isRequired,
    // Provide an array of indices whose corresponding items need to be stuck to the top of the recyclerView once the items scroll off the top.
    // Every subsequent sticky index view will push the previous sticky view off the top to take its place.
    // Note - Needs to be sorted ascending
    stickyHeaderIndices: PropTypes.arrayOf(PropTypes.number),
    // Works same as sticky headers, but for views to be stuck at the bottom of the recyclerView.
    // Note - Needs to be sorted ascending
    stickyFooterIndices: PropTypes.arrayOf(PropTypes.number),
    // Will be called instead of rowRenderer for all sticky items. Any changes to the item for when they are stuck can be done here.
    overrideRowRenderer: PropTypes.func,
    // For all practical purposes, pass the style that is applied to the RecyclerListView component here.
    style: PropTypes.object,
};
//# sourceMappingURL=StickyContainer.js.map