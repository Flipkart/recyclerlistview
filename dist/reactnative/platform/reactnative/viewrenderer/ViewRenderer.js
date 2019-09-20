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
var react_native_1 = require("react-native");
var BaseViewRenderer_1 = require("../../../core/viewrenderer/BaseViewRenderer");
/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
var ViewRenderer = /** @class */ (function (_super) {
    __extends(ViewRenderer, _super);
    function ViewRenderer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._dim = { width: 0, height: 0 };
        _this._viewRef = null;
        _this._setRef = function (view) {
            _this._viewRef = view;
        };
        _this._onLayout = function (event) {
            //Preventing layout thrashing in super fast scrolls where RN messes up onLayout event
            var xDiff = Math.abs(_this.props.x - event.nativeEvent.layout.x);
            var yDiff = Math.abs(_this.props.y - event.nativeEvent.layout.y);
            if (xDiff < 1 && yDiff < 1 &&
                (_this.props.height !== event.nativeEvent.layout.height ||
                    _this.props.width !== event.nativeEvent.layout.width)) {
                _this._dim.height = event.nativeEvent.layout.height;
                _this._dim.width = event.nativeEvent.layout.width;
                if (_this.props.onSizeChanged) {
                    _this.props.onSizeChanged(_this._dim, _this.props.index);
                }
            }
        };
        return _this;
    }
    ViewRenderer.prototype.render = function () {
        return this.props.forceNonDeterministicRendering ? (React.createElement(react_native_1.View, { ref: this._setRef, onLayout: this._onLayout, style: __assign({ flexDirection: this.props.isHorizontal ? "column" : "row", left: this.props.x, position: "absolute", top: this.props.y }, this.props.styleOverrides, this.animatorStyleOverrides) }, this.renderChild())) : (React.createElement(react_native_1.View, { ref: this._setRef, style: __assign({ left: this.props.x, position: "absolute", top: this.props.y, height: this.props.height, width: this.props.width }, this.props.styleOverrides, this.animatorStyleOverrides) }, this.renderChild()));
    };
    ViewRenderer.prototype.getRef = function () {
        return this._viewRef;
    };
    return ViewRenderer;
}(BaseViewRenderer_1.default));
exports.default = ViewRenderer;
//# sourceMappingURL=ViewRenderer.js.map