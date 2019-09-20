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
var CustomError_1 = require("../exceptions/CustomError");
var LayoutManager = /** @class */ (function () {
    function LayoutManager() {
    }
    LayoutManager.prototype.getOffsetForIndex = function (index) {
        var layouts = this.getLayouts();
        if (layouts.length > index) {
            return { x: layouts[index].x, y: layouts[index].y };
        }
        else {
            throw new CustomError_1.default({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    };
    //You can ovveride this incase you want to override style in some cases e.g, say you want to enfore width but not height
    LayoutManager.prototype.getStyleOverridesForIndex = function (index) {
        return undefined;
    };
    return LayoutManager;
}());
exports.LayoutManager = LayoutManager;
var WrapGridLayoutManager = /** @class */ (function (_super) {
    __extends(WrapGridLayoutManager, _super);
    function WrapGridLayoutManager(layoutProvider, renderWindowSize, isHorizontal, cachedLayouts) {
        if (isHorizontal === void 0) { isHorizontal = false; }
        var _this = _super.call(this) || this;
        _this._layoutProvider = layoutProvider;
        _this._window = renderWindowSize;
        _this._totalHeight = 0;
        _this._totalWidth = 0;
        _this._isHorizontal = !!isHorizontal;
        _this._layouts = cachedLayouts ? cachedLayouts : [];
        return _this;
    }
    WrapGridLayoutManager.prototype.getContentDimension = function () {
        return { height: this._totalHeight, width: this._totalWidth };
    };
    WrapGridLayoutManager.prototype.getLayouts = function () {
        return this._layouts;
    };
    WrapGridLayoutManager.prototype.getOffsetForIndex = function (index) {
        if (this._layouts.length > index) {
            return { x: this._layouts[index].x, y: this._layouts[index].y };
        }
        else {
            throw new CustomError_1.default({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    };
    WrapGridLayoutManager.prototype.overrideLayout = function (index, dim) {
        var layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
        return true;
    };
    WrapGridLayoutManager.prototype.setMaxBounds = function (itemDim) {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        }
        else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    };
    //TODO:Talha laziliy calculate in future revisions
    WrapGridLayoutManager.prototype.relayoutFromIndex = function (startIndex, itemCount) {
        startIndex = this._locateFirstNeighbourIndex(startIndex);
        var startX = 0;
        var startY = 0;
        var maxBound = 0;
        var startVal = this._layouts[startIndex];
        if (startVal) {
            startX = startVal.x;
            startY = startVal.y;
            this._pointDimensionsToRect(startVal);
        }
        var oldItemCount = this._layouts.length;
        var itemDim = { height: 0, width: 0 };
        var itemRect = null;
        var oldLayout = null;
        for (var i = startIndex; i < itemCount; i++) {
            oldLayout = this._layouts[i];
            var layoutType = this._layoutProvider.getLayoutTypeForIndex(i);
            if (oldLayout && oldLayout.isOverridden && oldLayout.type === layoutType) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            }
            else {
                this._layoutProvider.setComputedLayout(layoutType, itemDim, i);
            }
            this.setMaxBounds(itemDim);
            while (!this._checkBounds(startX, startY, itemDim, this._isHorizontal)) {
                if (this._isHorizontal) {
                    startX += maxBound;
                    startY = 0;
                    this._totalWidth += maxBound;
                }
                else {
                    startX = 0;
                    startY += maxBound;
                    this._totalHeight += maxBound;
                }
                maxBound = 0;
            }
            maxBound = this._isHorizontal ? Math.max(maxBound, itemDim.width) : Math.max(maxBound, itemDim.height);
            //TODO: Talha creating array upfront will speed this up
            if (i > oldItemCount - 1) {
                this._layouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width, type: layoutType });
            }
            else {
                itemRect = this._layouts[i];
                itemRect.x = startX;
                itemRect.y = startY;
                itemRect.type = layoutType;
                itemRect.width = itemDim.width;
                itemRect.height = itemDim.height;
            }
            if (this._isHorizontal) {
                startY += itemDim.height;
            }
            else {
                startX += itemDim.width;
            }
        }
        if (oldItemCount > itemCount) {
            this._layouts.splice(itemCount, oldItemCount - itemCount);
        }
        this._setFinalDimensions(maxBound);
    };
    WrapGridLayoutManager.prototype._pointDimensionsToRect = function (itemRect) {
        if (this._isHorizontal) {
            this._totalWidth = itemRect.x;
        }
        else {
            this._totalHeight = itemRect.y;
        }
    };
    WrapGridLayoutManager.prototype._setFinalDimensions = function (maxBound) {
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    };
    WrapGridLayoutManager.prototype._locateFirstNeighbourIndex = function (startIndex) {
        if (startIndex === 0) {
            return 0;
        }
        var i = startIndex - 1;
        for (; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[i].y === 0) {
                    break;
                }
            }
            else if (this._layouts[i].x === 0) {
                break;
            }
        }
        return i;
    };
    WrapGridLayoutManager.prototype._checkBounds = function (itemX, itemY, itemDim, isHorizontal) {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    };
    return WrapGridLayoutManager;
}(LayoutManager));
exports.WrapGridLayoutManager = WrapGridLayoutManager;
//# sourceMappingURL=LayoutManager.js.map