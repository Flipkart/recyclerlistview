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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var BaseViewRenderer = /** @class */ (function (_super) {
    __extends(BaseViewRenderer, _super);
    function BaseViewRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BaseViewRenderer.prototype.shouldComponentUpdate = function (newProps) {
        var hasMoved = this.props.x !== newProps.x || this.props.y !== newProps.y;
        var hasSizeChanged = !newProps.forceNonDeterministicRendering &&
            (this.props.width !== newProps.width || this.props.height !== newProps.height) ||
            this.props.layoutProvider !== newProps.layoutProvider;
        var hasExtendedStateChanged = this.props.extendedState !== newProps.extendedState;
        var hasInternalSnapshotChanged = this.props.internalSnapshot !== newProps.internalSnapshot;
        var hasDataChanged = (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data));
        var shouldUpdate = hasSizeChanged || hasDataChanged || hasExtendedStateChanged || hasInternalSnapshotChanged;
        if (shouldUpdate) {
            newProps.itemAnimator.animateWillUpdate(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef(), newProps.index);
        }
        else if (hasMoved) {
            shouldUpdate = !newProps.itemAnimator.animateShift(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef(), newProps.index);
        }
        return shouldUpdate;
    };
    BaseViewRenderer.prototype.componentDidMount = function () {
        this.animatorStyleOverrides = undefined;
        this.props.itemAnimator.animateDidMount(this.props.x, this.props.y, this.getRef(), this.props.index);
    };
    BaseViewRenderer.prototype.componentWillMount = function () {
        this.animatorStyleOverrides = this.props.itemAnimator.animateWillMount(this.props.x, this.props.y, this.props.index);
    };
    BaseViewRenderer.prototype.componentWillUnmount = function () {
        this.props.itemAnimator.animateWillUnmount(this.props.x, this.props.y, this.getRef(), this.props.index);
    };
    BaseViewRenderer.prototype.renderChild = function () {
        return this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index, this.props.extendedState);
    };
    return BaseViewRenderer;
}(React.Component));
exports.default = BaseViewRenderer;
//# sourceMappingURL=BaseViewRenderer.js.map