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
    public static findClosestValueToTarget(values: number[], target: number): ValueAndIndex {
        let low = 0;
        let high = values.length - 1;
        let mid = Math.floor((low + high) / 2);
        let midValue = values[mid];
        let lastMidValue = midValue + 1;

        while (low <= high && midValue !== lastMidValue) {
            if (midValue === target) {
                break;
            } else if (midValue < target) {
                low = mid;
            } else if (midValue > target) {
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
    }
    /**
     * Largest value from given values that is smaller or equal to the target number.
     */
    public static findValueSmallerThanTarget(values: number[], target: number): ValueAndIndex | undefined {
        const low = 0;
        const high = values.length - 1;
        if (target >= values[high]) {
            return {
                value: values[high],
                index: high,
            };
        } else if (target < values[low]) {
            return undefined;
        }
        const midValueAndIndex: ValueAndIndex = this.findClosestValueToTarget(values, target);
        const midValue: number = midValueAndIndex.value;
        const mid: number = midValueAndIndex.index;
        if (midValue <= target) {
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
    /**
     * Smallest value from given values that is larger or equal to the target number.
     */
    public static findValueLargerThanTarget(values: number[], target: number): ValueAndIndex | undefined {
        const low = 0;
        const high = values.length - 1;
        if (target < values[low]) {
            return {
                value: values[low],
                index: low,
            };
        } else if (target > values[high]) {
            return undefined;
        }
        const midValueAndIndex: ValueAndIndex = this.findClosestValueToTarget(values, target);
        const midValue: number = midValueAndIndex.value;
        const mid: number = midValueAndIndex.index;
        if (midValue >= target) {
            return {
                value: midValue,
                index: mid,
            };
        } else {
            return {
                value: values[mid + 1],
                index: mid + 1,
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
