"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * Context provider is useful in cases where your view gets destroyed and you want to maintain scroll position when recyclerlistview is recreated e.g,
 * back navigation in android when previous fragments onDestroyView has already been called. Since recyclerlistview only renders visible items you
 * can instantly jump to any location.
 *
 * Use this interface and implement the given methods to preserve context.
 */
var ContextProvider = /** @class */ (function () {
    function ContextProvider() {
    }
    return ContextProvider;
}());
exports.default = ContextProvider;
//# sourceMappingURL=ContextProvider.js.map