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
var React = require("react");
var BaseScrollComponent_1 = require("../../../core/scrollcomponent/BaseScrollComponent");
var ScrollViewer_1 = require("./ScrollViewer");
/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * RecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */
var ScrollComponent = /** @class */ (function (_super) {
    __extends(ScrollComponent, _super);
    function ScrollComponent(args) {
        var _this = _super.call(this, args) || this;
        _this._scrollViewRef = null;
        _this._onScroll = function (e) {
            _this.props.onScroll(e.nativeEvent.contentOffset.x, e.nativeEvent.contentOffset.y, e);
        };
        _this._onSizeChanged = function (event) {
            if (_this.props.onSizeChanged) {
                _this.props.onSizeChanged(event);
            }
        };
        _this._height = 0;
        _this._width = 0;
        return _this;
    }
    ScrollComponent.prototype.scrollTo = function (x, y, animated) {
        if (this._scrollViewRef) {
            this._scrollViewRef.scrollTo({ x: x, y: y, animated: animated });
        }
    };
    ScrollComponent.prototype.render = function () {
        var _this = this;
        var Scroller = this.props.externalScrollView; //TSI
        return (React.createElement(Scroller, __assign({ ref: function (scrollView) { return _this._scrollViewRef = scrollView; } }, this.props, { horizontal: this.props.isHorizontal, onScroll: this._onScroll, onSizeChanged: this._onSizeChanged }),
            React.createElement("div", { style: {
                    height: this.props.contentHeight,
                    width: this.props.contentWidth,
                } }, this.props.children),
            this.props.renderFooter ? React.createElement("div", { style: this.props.isHorizontal ? {
                    left: this.props.contentWidth,
                    position: "absolute",
                    top: 0,
                } : undefined }, this.props.renderFooter()) : null));
    };
    ScrollComponent.defaultProps = {
        contentHeight: 0,
        contentWidth: 0,
        externalScrollView: ScrollViewer_1.default,
        isHorizontal: false,
        scrollThrottle: 16,
        canChangeSize: false,
    };
    return ScrollComponent;
}(BaseScrollComponent_1.default));
exports.default = ScrollComponent;
//# sourceMappingURL=ScrollComponent.js.map