import CustomError from "../core/exceptions/CustomError";

export interface ValueAndIndex {
    value: number;
    index: number;
}
export default class BinarySearch {
    public static findClosestHigherValueIndex(size: number, targetValue: number, valueExtractor: (index: number) => number): number {
        let low = 0;
        let high = size - 1;
        let mid = Math.floor((low + high) / 2);
        let lastValue = 0;
        let absoluteLastDiff = Math.abs(valueExtractor(mid) - targetValue);
        let result = mid;
        let diff = 0;
        let absoluteDiff = 0;

        if (absoluteLastDiff === 0) {
            return result;
        }

        if (high < 0) {
            throw new CustomError({
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
            } else if (targetValue > lastValue) {
                low = mid + 1;
            } else {
                return mid;
            }
        }
        return result;
    }
    /**
     * Largest value from given values that is smaller or equal to the target number.
     */
    public static findValueSmallerThanGivenRange(values: number[], target: number): ValueAndIndex {
        let high = values.length - 1;
        if (target > values[high]) {
            return {
                value: values[high],
                index: high,
            };
        }
        let low = 0;
        let mid = Math.floor((low + high) / 2);
        let midValue = values[mid];
        let lastMidValue = midValue + 1;

        while (low <= high && midValue !== lastMidValue) {
            if (midValue === target) {
                return {
                    value: midValue,
                    index: mid,
                };
            } else if (midValue < target) {
                low = mid;
            } else if (midValue > target) {
                high = mid;
            }
            mid = Math.floor((low + high) / 2);
            lastMidValue = midValue;
            midValue = values[mid];
        }

        if (midValue < target) {
            return {
                value: midValue,
                index: mid,
            };
        } else {
            return {
                value: values[mid - 1],
                index: mid - 1,
            };
        }
    }
    public static findIndexOf(array: number[], value: number): number {
        let j = 0;
        let length = array.length;
        let i = 0;
        while (j < length) {
            i = length + j - 1 >> 1;
            if (value > array[i]) {
                j = i + 1;
            } else if (value < array[i]) {
                length = i;
            } else {
                return i;
            }
        }
        return -1;
    }
}
