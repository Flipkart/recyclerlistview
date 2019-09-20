"use strict";
/**
 * Created by ananya.chandra on 20/09/18.
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
Object.defineProperty(exports, "__esModule", { value: true });
var StickyObject_1 = require("./StickyObject");
var BinarySearch_1 = require("../../utils/BinarySearch");
var StickyFooter = /** @class */ (function (_super) {
    __extends(StickyFooter, _super);
    function StickyFooter(props, context) {
        return _super.call(this, props, context) || this;
    }
    StickyFooter.prototype.initStickyParams = function () {
        this.stickyType = StickyObject_1.StickyType.FOOTER;
        this.stickyTypeMultiplier = -1;
        this.containerPosition = { bottom: 0 };
        this.bounceScrolling = false;
    };
    StickyFooter.prototype.calculateVisibleStickyIndex = function (stickyIndices, _smallestVisibleIndex, largestVisibleIndex, offsetY, distanceFromWindow, windowBound) {
        if (stickyIndices && largestVisibleIndex) {
            this.bounceScrolling = this.hasReachedBoundary(offsetY, distanceFromWindow, windowBound);
            if (largestVisibleIndex > stickyIndices[stickyIndices.length - 1] || this.bounceScrolling) {
                this.stickyVisiblity = false;
            }
            else {
                this.stickyVisiblity = true;
                var valueAndIndex = BinarySearch_1.default.findValueLargerThanTarget(stickyIndices, largestVisibleIndex);
                if (valueAndIndex) {
                    this.currentIndex = valueAndIndex.index;
                    this.currentStickyIndex = valueAndIndex.value;
                }
                else {
                    console.log("Footer sticky index calculation gone wrong."); //tslint:disable-line
                }
            }
        }
    };
    StickyFooter.prototype.getNextYd = function (nextY, nextHeight) {
        return -1 * (nextY + nextHeight);
    };
    StickyFooter.prototype.getCurrentYd = function (currentY, currentHeight) {
        return -1 * (currentY + currentHeight);
    };
    StickyFooter.prototype.getScrollY = function (offsetY, scrollableHeight) {
        return scrollableHeight ? -1 * (offsetY + scrollableHeight) : undefined;
    };
    StickyFooter.prototype.hasReachedBoundary = function (offsetY, distanceFromWindow, windowBound) {
        if (windowBound) {
            var endReachedMargin = Math.round(offsetY - (windowBound + distanceFromWindow));
            return endReachedMargin >= 0;
        }
        return false;
    };
    return StickyFooter;
}(StickyObject_1.default));
exports.default = StickyFooter;
//# sourceMappingURL=StickyFooter.js.map