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
        _this._mainDiv = null;
        _this._setRef = function (div) {
            _this._mainDiv = div;
        };
        return _this;
    }
    ViewRenderer.prototype.componentDidMount = function () {
        if (_super.prototype.componentDidMount) {
            _super.prototype.componentDidMount.call(this);
        }
        this._checkSizeChange();
    };
    ViewRenderer.prototype.componentDidUpdate = function () {
        this._checkSizeChange();
    };
    ViewRenderer.prototype.render = function () {
        var style = this.props.forceNonDeterministicRendering
            ? __assign({ transform: this._getTransform(), WebkitTransform: this._getTransform() }, styles.baseViewStyle, this.props.styleOverrides, this.animatorStyleOverrides) : __assign({ height: this.props.height, overflow: "hidden", width: this.props.width, transform: this._getTransform(), WebkitTransform: this._getTransform() }, styles.baseViewStyle, this.props.styleOverrides, this.animatorStyleOverrides);
        return (React.createElement("div", { ref: this._setRef, style: style }, this.renderChild()));
    };
    ViewRenderer.prototype.getRef = function () {
        return this._mainDiv;
    };
    ViewRenderer.prototype._getTransform = function () {
        return "translate(" + this.props.x + "px," + this.props.y + "px)";
    };
    ViewRenderer.prototype._checkSizeChange = function () {
        if (this.props.forceNonDeterministicRendering && this.props.onSizeChanged) {
            var mainDiv = this._mainDiv;
            if (mainDiv) {
                this._dim.width = mainDiv.clientWidth;
                this._dim.height = mainDiv.clientHeight;
                if (this.props.width !== this._dim.width || this.props.height !== this._dim.height) {
                    this.props.onSizeChanged(this._dim, this.props.index);
                }
            }
        }
    };
    return ViewRenderer;
}(BaseViewRenderer_1.default));
exports.default = ViewRenderer;
var styles = {
    baseViewStyle: {
        alignItems: "stretch",
        borderWidth: 0,
        borderStyle: "solid",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        position: "absolute",
        minHeight: 0,
        minWidth: 0,
        left: 0,
        top: 0,
    },
};
//# sourceMappingURL=ViewRenderer.js.map