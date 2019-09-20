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
var RecyclerListView_1 = require("./RecyclerListView");
/**
 * This will incremently update renderAhread distance and render the page progressively.
 */
var ProgressiveListView = /** @class */ (function (_super) {
    __extends(ProgressiveListView, _super);
    function ProgressiveListView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ProgressiveListView.prototype.componentDidMount = function () {
        if (_super.prototype.componentDidMount) {
            _super.prototype.componentDidMount.call(this);
        }
        this.updateRenderAheadProgessively(this.getCurrentRenderAheadOffset());
    };
    ProgressiveListView.prototype.updateRenderAheadProgessively = function (newVal) {
        var _this = this;
        this.cancelRenderAheadUpdate(); // Cancel any pending callback.
        this.renderAheadUdpateCallbackId = requestAnimationFrame(function () {
            if (!_this.updateRenderAheadOffset(newVal)) {
                _this.updateRenderAheadProgessively(newVal);
            }
            else {
                _this.incrementRenderAhead();
            }
        });
    };
    ProgressiveListView.prototype.incrementRenderAhead = function () {
        if (this.props.maxRenderAhead && this.props.renderAheadStep) {
            var layoutManager = this.getVirtualRenderer().getLayoutManager();
            var currentRenderAheadOffset = this.getCurrentRenderAheadOffset();
            if (layoutManager) {
                var contentDimension = layoutManager.getContentDimension();
                var maxContentSize = this.props.isHorizontal ? contentDimension.width : contentDimension.height;
                if (currentRenderAheadOffset < maxContentSize && currentRenderAheadOffset < this.props.maxRenderAhead) {
                    var newRenderAheadOffset = currentRenderAheadOffset + this.props.renderAheadStep;
                    this.updateRenderAheadProgessively(newRenderAheadOffset);
                }
            }
        }
    };
    ProgressiveListView.prototype.cancelRenderAheadUpdate = function () {
        if (this.renderAheadUdpateCallbackId) {
            cancelAnimationFrame(this.renderAheadUdpateCallbackId);
        }
    };
    ProgressiveListView.defaultProps = __assign({}, RecyclerListView_1.default.defaultProps, { maxRenderAhead: Number.MAX_VALUE, renderAheadStep: 300, renderAheadOffset: 0 });
    return ProgressiveListView;
}(RecyclerListView_1.default));
exports.default = ProgressiveListView;
//# sourceMappingURL=ProgressiveListView.js.map