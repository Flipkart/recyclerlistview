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
var React = require("react");
var BaseScrollView_1 = require("../../../core/scrollcomponent/BaseScrollView");
var debounce = require("lodash.debounce");
var ScrollEventNormalizer_1 = require("./ScrollEventNormalizer");
var scrollEndEventSimulator = debounce(function (executable) {
    executable();
}, 1200);
/***
 * A scrollviewer that mimics react native scrollview. Additionally on web it can start listening to window scroll events optionally.
 * Supports both window scroll and scrollable divs inside other divs.
 */
var ScrollViewer = /** @class */ (function (_super) {
    __extends(ScrollViewer, _super);
    function ScrollViewer(args) {
        var _this = _super.call(this, args) || this;
        _this._mainDivRef = null;
        _this._isScrolling = false;
        _this._scrollEventNormalizer = null;
        _this._onScroll = _this._onScroll.bind(_this);
        _this._windowOnScroll = _this._windowOnScroll.bind(_this);
        _this._getRelevantOffset = _this._getRelevantOffset.bind(_this);
        _this._setRelevantOffset = _this._setRelevantOffset.bind(_this);
        _this._onWindowResize = _this._onWindowResize.bind(_this);
        _this._isScrollEnd = _this._isScrollEnd.bind(_this);
        _this._trackScrollOccurence = _this._trackScrollOccurence.bind(_this);
        _this._setDivRef = _this._setDivRef.bind(_this);
        return _this;
    }
    ScrollViewer.prototype.componentDidMount = function () {
        if (this.props.onSizeChanged) {
            if (this.props.useWindowScroll) {
                this._startListeningToWindowEvents();
                this.props.onSizeChanged({ height: window.innerHeight, width: window.innerWidth });
            }
            else if (this._mainDivRef) {
                this._startListeningToDivEvents();
                this.props.onSizeChanged({ height: this._mainDivRef.clientHeight, width: this._mainDivRef.clientWidth });
            }
        }
    };
    ScrollViewer.prototype.componentWillUnmount = function () {
        window.removeEventListener("scroll", this._windowOnScroll);
        if (this._mainDivRef) {
            this._mainDivRef.removeEventListener("scroll", this._onScroll);
        }
        window.removeEventListener("resize", this._onWindowResize);
    };
    ScrollViewer.prototype.scrollTo = function (scrollInput) {
        if (scrollInput.animated) {
            this._doAnimatedScroll(this.props.horizontal ? scrollInput.x : scrollInput.y);
        }
        else {
            this._setRelevantOffset(this.props.horizontal ? scrollInput.x : scrollInput.y);
        }
    };
    ScrollViewer.prototype.render = function () {
        return !this.props.useWindowScroll
            ? React.createElement("div", { ref: this._setDivRef, style: __assign({ WebkitOverflowScrolling: "touch", height: "100%", overflowX: this.props.horizontal ? "scroll" : "hidden", overflowY: !this.props.horizontal ? "scroll" : "hidden", width: "100%" }, this.props.style) },
                React.createElement("div", { style: { position: "relative" } }, this.props.children))
            : React.createElement("div", { ref: this._setDivRef, style: { position: "relative" } }, this.props.children);
    };
    ScrollViewer.prototype._setDivRef = function (div) {
        this._mainDivRef = div;
        if (div) {
            this._scrollEventNormalizer = new ScrollEventNormalizer_1.ScrollEventNormalizer(div);
        }
        else {
            this._scrollEventNormalizer = null;
        }
    };
    ScrollViewer.prototype._getRelevantOffset = function () {
        if (!this.props.useWindowScroll) {
            if (this._mainDivRef) {
                if (this.props.horizontal) {
                    return this._mainDivRef.scrollLeft;
                }
                else {
                    return this._mainDivRef.scrollTop;
                }
            }
            return 0;
        }
        else {
            if (this.props.horizontal) {
                return window.scrollX;
            }
            else {
                return window.scrollY;
            }
        }
    };
    ScrollViewer.prototype._setRelevantOffset = function (offset) {
        if (!this.props.useWindowScroll) {
            if (this._mainDivRef) {
                if (this.props.horizontal) {
                    this._mainDivRef.scrollLeft = offset;
                }
                else {
                    this._mainDivRef.scrollTop = offset;
                }
            }
        }
        else {
            if (this.props.horizontal) {
                window.scrollTo(offset, 0);
            }
            else {
                window.scrollTo(0, offset);
            }
        }
    };
    ScrollViewer.prototype._isScrollEnd = function () {
        if (this._mainDivRef) {
            this._mainDivRef.style.pointerEvents = "auto";
        }
        this._isScrolling = false;
    };
    ScrollViewer.prototype._trackScrollOccurence = function () {
        if (!this._isScrolling) {
            if (this._mainDivRef) {
                this._mainDivRef.style.pointerEvents = "none";
            }
            this._isScrolling = true;
        }
        scrollEndEventSimulator(this._isScrollEnd);
    };
    ScrollViewer.prototype._doAnimatedScroll = function (offset) {
        var _this = this;
        var start = this._getRelevantOffset();
        if (offset > start) {
            start = Math.max(offset - 800, start);
        }
        else {
            start = Math.min(offset + 800, start);
        }
        var change = offset - start;
        var increment = 20;
        var duration = 200;
        var animateScroll = function (elapsedTime) {
            elapsedTime += increment;
            var position = _this._easeInOut(elapsedTime, start, change, duration);
            _this._setRelevantOffset(position);
            if (elapsedTime < duration) {
                window.setTimeout(function () { return animateScroll(elapsedTime); }, increment);
            }
        };
        animateScroll(0);
    };
    ScrollViewer.prototype._startListeningToDivEvents = function () {
        if (this._mainDivRef) {
            this._mainDivRef.addEventListener("scroll", this._onScroll);
        }
    };
    ScrollViewer.prototype._startListeningToWindowEvents = function () {
        window.addEventListener("scroll", this._windowOnScroll);
        if (this.props.canChangeSize) {
            window.addEventListener("resize", this._onWindowResize);
        }
    };
    ScrollViewer.prototype._onWindowResize = function () {
        if (this.props.onSizeChanged && this.props.useWindowScroll) {
            this.props.onSizeChanged({ height: window.innerHeight, width: window.innerWidth });
        }
    };
    ScrollViewer.prototype._windowOnScroll = function () {
        if (this.props.onScroll) {
            if (this._scrollEventNormalizer) {
                this.props.onScroll(this._scrollEventNormalizer.windowEvent);
            }
        }
    };
    ScrollViewer.prototype._onScroll = function () {
        if (this.props.onScroll) {
            if (this._scrollEventNormalizer) {
                this.props.onScroll(this._scrollEventNormalizer.divEvent);
            }
        }
    };
    ScrollViewer.prototype._easeInOut = function (currentTime, start, change, duration) {
        currentTime /= duration / 2;
        if (currentTime < 1) {
            return change / 2 * currentTime * currentTime + start;
        }
        currentTime -= 1;
        return (-change) / 2 * (currentTime * (currentTime - 2) - 1) + start;
    };
    ScrollViewer.defaultProps = {
        canChangeSize: false,
        horizontal: false,
        style: null,
        useWindowScroll: false,
    };
    return ScrollViewer;
}(BaseScrollView_1.default));
exports.default = ScrollViewer;
//# sourceMappingURL=ScrollViewer.js.map