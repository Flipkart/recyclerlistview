"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var RecyclerListView_1 = require("./RecyclerListView");
var DynamicRenderAheadRecyclerListView = /** @class */ (function (_super) {
    __extends(DynamicRenderAheadRecyclerListView, _super);
    function DynamicRenderAheadRecyclerListView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DynamicRenderAheadRecyclerListView.prototype.componentDidUpdate = function () {
        if (this.props.maxRenderAhead && this.props.renderAheadStep) {
            var layoutManager = this._virtualRenderer.getLayoutManager();
            var currentRenderAheadOffset = this.getRenderAheadOffset();
            if (layoutManager && currentRenderAheadOffset !== -1) {
                var contentDimension = layoutManager.getContentDimension();
                var maxContentSize = this.props.isHorizontal ? contentDimension.width : contentDimension.height;
                if (currentRenderAheadOffset < maxContentSize && currentRenderAheadOffset < this.props.maxRenderAhead) {
                    var newRenderAheadOffset = currentRenderAheadOffset + this.props.renderAheadStep;
                    this._updateOffset(newRenderAheadOffset);
                }
            }
        }
    };
    DynamicRenderAheadRecyclerListView.prototype._updateOffset = function (newVal) {
        var _this = this;
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUdpateCallbackId = requestAnimationFrame(function () {
            if (!_this.updateRenderAheadOffset(newVal)) {
                _this._updateOffset(newVal);
            }
        });
    };
    DynamicRenderAheadRecyclerListView.prototype.cancelRenderAheadUpdate = function () {
        if (this.renderAheadUdpateCallbackId) {
            cancelAnimationFrame(this.renderAheadUdpateCallbackId);
        }
    };
    DynamicRenderAheadRecyclerListView.defaultProps = __assign({}, RecyclerListView_1.default.defaultProps, { maxRenderAhead: Number.MAX_VALUE, renderAheadStep: 100 });
    return DynamicRenderAheadRecyclerListView;
}(RecyclerListView_1.default));
exports.default = DynamicRenderAheadRecyclerListView;
// DynamicRenderAheadRecyclerListView.prototype = {
//     ...RecyclerListView.propTypes,
//     maxRenderAhead: PropTypes.number,
//     renderAheadStep: PropTypes.number
// }
//# sourceMappingURL=DynamicRenderAheadRecyclerListView.js.map