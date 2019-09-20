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
    BinarySearch.findClosestValueToTarget = function (values, target) {
        var low = 0;
        var high = values.length - 1;
        var mid = Math.floor((low + high) / 2);
        var midValue = values[mid];
        var lastMidValue = midValue + 1;
        while (low <= high && midValue !== lastMidValue) {
            if (midValue === target) {
                break;
            }
            else if (midValue < target) {
                low = mid;
            }
            else if (midValue > target) {
                high = mid;
            }
            mid = Math.floor((low + high) / 2);
            lastMidValue = midValue;
            midValue = values[mid];
        }
        return {
            value: midValue,
            index: mid,
        };
    };
    /**
     * Largest value from given values that is smaller or equal to the target number.
     */
    BinarySearch.findValueSmallerThanTarget = function (values, target) {
        var low = 0;
        var high = values.length - 1;
        if (target > values[high]) {
            return {
                value: values[high],
                index: high,
            };
        }
        else if (target < values[low]) {
            return undefined;
        }
        var midValueAndIndex = this.findClosestValueToTarget(values, target);
        var midValue = midValueAndIndex.value;
        var mid = midValueAndIndex.index;
        if (midValue <= target) {
            return {
                value: midValue,
                index: mid,
            };
        }
        else {
            return {
                value: values[mid - 1],
                index: mid - 1,
            };
        }
    };
    /**
     * Smallest value from given values that is larger or equal to the target number.
     */
    BinarySearch.findValueLargerThanTarget = function (values, target) {
        var low = 0;
        var high = values.length - 1;
        if (target < values[low]) {
            return {
                value: values[low],
                index: low,
            };
        }
        else if (target > values[high]) {
            return undefined;
        }
        var midValueAndIndex = this.findClosestValueToTarget(values, target);
        var midValue = midValueAndIndex.value;
        var mid = midValueAndIndex.index;
        if (midValue >= target) {
            return {
                value: midValue,
                index: mid,
            };
        }
        else {
            return {
                value: values[mid + 1],
                index: mid + 1,
            };
        }
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