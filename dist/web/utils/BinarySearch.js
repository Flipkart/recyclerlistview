"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CustomError_1 = require("../core/exceptions/CustomError");
var BinarySearch = /** @class */ (function () {
    function BinarySearch() {
    }
    BinarySearch.findClosestHigherValueIndex = function (size, targetValue, valueExtractor) {
        var low = 0;
        var high = size - 1;
        var mid = Math.floor((low + high) / 2);
        var lastValue = 0;
        var absoluteLastDiff = Math.abs(valueExtractor(mid) - targetValue);
        var result = mid;
        var diff = 0;
        var absoluteDiff = 0;
        if (absoluteLastDiff === 0) {
            return result;
        }
        if (high < 0) {
            throw new CustomError_1.default({
                message: "The collection cannot be empty",
                type: "InvalidStateException",
            });
        }
        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            lastValue = valueExtractor(mid);
            diff = lastValue - targetValue;
            absoluteDiff = Math.abs(diff);
            if (diff >= 0 && absoluteDiff < absoluteLastDiff) {
                absoluteLastDiff = absoluteDiff;
                result = mid;
            }
            if (targetValue < lastValue) {
                high = mid - 1;
            }
            else if (targetValue > lastValue) {
                low = mid + 1;
            }
            else {
                return mid;
            }
        }
        return result;
    };
    BinarySearch.findIndexOf = function (array, value) {
        var j = 0;
        var length = array.length;
        var i = 0;
        while (j < length) {
            i = length + j - 1 >> 1;
            if (value > array[i]) {
                j = i + 1;
            }
            else if (value < array[i]) {
                length = i;
            }
            else {
                return i;
            }
        }
        return -1;
    };
    return BinarySearch;
}());
exports.default = BinarySearch;
//# sourceMappingURL=BinarySearch.js.map