"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AutoScroll = /** @class */ (function () {
    function AutoScroll() {
    }
    AutoScroll.scrollNow = function (scrollable, fromX, fromY, toX, toY, speedMultiplier) {
        if (speedMultiplier === void 0) { speedMultiplier = 1; }
        return new Promise(function (resolve) {
            scrollable.scrollToOffset(fromX, fromY, false);
            var incrementPerMs = 0.1 * speedMultiplier;
            var startTime = Date.now();
            var startX = fromX;
            var startY = fromY;
            var animationLoop = function () {
                requestAnimationFrame(function () {
                    var currentTime = Date.now();
                    var timeElapsed = currentTime - startTime;
                    var distanceToCover = incrementPerMs * timeElapsed;
                    startX += distanceToCover;
                    startY += distanceToCover;
                    scrollable.scrollToOffset(Math.min(toX, startX), Math.min(toY, startY), false);
                    startTime = currentTime;
                    if (Math.min(toX, startX) !== toX || Math.min(toY, startY) !== toY) {
                        animationLoop();
                        return;
                    }
                    resolve();
                });
            };
            animationLoop();
        });
    };
    return AutoScroll;
}());
exports.AutoScroll = AutoScroll;
//# sourceMappingURL=AutoScroll.js.map