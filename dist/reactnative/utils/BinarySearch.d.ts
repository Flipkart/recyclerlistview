export interface ValueAndIndex {
    value: number;
    index: number;
}
export default class BinarySearch {
    static findClosestHigherValueIndex(size: number, targetValue: number, valueExtractor: (index: number) => number): number;
    static findClosestValueToTarget(values: number[], target: number): ValueAndIndex;
    /**
     * Largest value from given values that is smaller or equal to the target number.
     */
    static findValueSmallerThanTarget(values: number[], target: number): ValueAndIndex | undefined;
    /**
     * Smallest value from given values that is larger or equal to the target number.
     */
    static findValueLargerThanTarget(values: number[], target: number): ValueAndIndex | undefined;
    static findIndexOf(array: number[], value: number): number;
}
