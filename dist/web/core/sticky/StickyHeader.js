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
var StickyHeader = /** @class */ (function (_super) {
    __extends(StickyHeader, _super);
    function StickyHeader(props, context) {
        return _super.call(this, props, context) || this;
    }
    StickyHeader.prototype.initStickyParams = function () {
        this.stickyType = StickyObject_1.StickyType.HEADER;
        this.stickyTypeMultiplier = 1;
        this.containerPosition = { top: 0 };
        // Kept as true contrary to as in StickyFooter because in case of initialOffset not given, onScroll isn't called and boundaryProcessing isn't done.
        // Default behaviour in that case will be sticky header hidden.
        this.bounceScrolling = true;
    };
    StickyHeader.prototype.calculateVisibleStickyIndex = function (stickyIndices, smallestVisibleIndex, largestVisibleIndex, offsetY, distanceFromWindow) {
        if (stickyIndices && smallestVisibleIndex !== undefined) {
            this.bounceScrolling = this.hasReachedBoundary(offsetY, distanceFromWindow);
            if (smallestVisibleIndex < stickyIndices[0] || this.bounceScrolling) {
                this.stickyVisiblity = false;
            }
            else {
                this.stickyVisiblity = true;
                var valueAndIndex = BinarySearch_1.default.findValueSmallerThanTarget(stickyIndices, smallestVisibleIndex);
                if (valueAndIndex) {
                    this.currentIndex = valueAndIndex.index;
                    this.currentStickyIndex = valueAndIndex.value;
                }
                else {
                    console.log("Header sticky index calculation gone wrong."); //tslint:disable-line
                }
            }
        }
    };
    StickyHeader.prototype.getNextYd = function (nextY, nextHeight) {
        return nextY;
    };
    StickyHeader.prototype.getCurrentYd = function (currentY, currentHeight) {
        return currentY;
    };
    StickyHeader.prototype.getScrollY = function (offsetY, scrollableHeight) {
        return offsetY;
    };
    StickyHeader.prototype.hasReachedBoundary = function (offsetY, distanceFromWindow, _windowBound) {
        return offsetY <= distanceFromWindow;
    };
    return StickyHeader;
}(StickyObject_1.default));
exports.default = StickyHeader;
//# sourceMappingURL=StickyHeader.js.map