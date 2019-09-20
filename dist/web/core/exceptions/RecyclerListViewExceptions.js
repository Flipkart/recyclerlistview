"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RecyclerListViewExceptions = {
    initializationException: {
        message: "Parameters required for initializing the module are missing",
        type: "Initialization essentials missing",
    },
    itemBoundsException: {
        message: "Dimensions cannot be undefined or null, check if LayoutProvider returns irregular values",
        type: "ItemBoundsException",
    },
    itemTypeNullException: {
        message: "RecyclerListView items always require a type, check if LayoutProvider returns irregular values",
        type: "ItemTypeNullException",
    },
    layoutException: {
        message: "RecyclerListView needs to have a bounded size. Currently height or, width is 0." +
            "Consider adding style={{flex:1}} or, fixed dimensions",
        type: "LayoutException",
    },
    platformNotDetectedException: {
        message: "Unable to detect the running platform, if you're trying to run recyclerlistview " +
            "in browser make sure process.env.RLV_ENV is set to browser in webpack config",
        type: "PlatformNotDetectedException",
    },
    unresolvedDependenciesException: {
        message: "missing datasource or layout provider, cannot proceed without it",
        type: "UnresolvedDependenciesException",
    },
    refNotAsFunctionException: {
        message: "When using StickyContainer, RecyclerListView needs to use ref as a function and not as a string.",
        type: "RefNotAsFunctionException",
    },
    wrongStickyChildTypeException: {
        message: "StickyContainer can only have a single child of type RecyclerListView.",
        type: "WrongStickyChildTypeException",
    },
    usingOldVisibleIndexesChangedParam: {
        message: "onVisibleIndexesChanged has been deprecated. Please use onVisibleIndicesChanged instead.",
        type: "usingOldVisibleIndexesChangedParam",
    },
    stickyIndicesArraySortError: {
        message: "The sticky indices array passed to StickyContainer isn't sorted in ascending order.",
        type: "stickyIndicesArraySortError",
    },
};
exports.default = RecyclerListViewExceptions;
//# sourceMappingURL=RecyclerListViewExceptions.js.map