class NearestBinarySearch {
    findClosestHigherValueIndex(size, targetValue, valueExtractor) {
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
            throw {
                message: "The collection cannot be empty",
                type: "InvalidStateException"
            };
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
}
export default new NearestBinarySearch();