class NearestBinarySearch {
    findClosestHigherValueIndex(size, targetValue, valueExtractor) {
        let low = 0;
        let high = size - 1;
        let mid = Math.floor((low + high) / 2);
        let lastValue = 0;
        let lastDiff = valueExtractor(mid) - targetValue;
        let result = mid;
        let diff = 0;

        if (lastDiff == 0) {
            return result;
        }

        if (high < 0)
            throw "The collection cannot be empty";

        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            lastValue = valueExtractor(mid);
            diff = lastValue - targetValue;
            if (diff >= 0 && diff < lastDiff) {
                lastDiff = diff;
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