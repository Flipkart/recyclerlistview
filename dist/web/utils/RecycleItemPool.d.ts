/***
 * Recycle pool for maintaining recyclable items, supports segregation by type as well.
 * Availability check, add/remove etc are all O(1), uses two maps to achieve constant time operation
 */
export default class RecycleItemPool {
    private _recyclableObjectMap;
    private _availabilitySet;
    constructor();
    putRecycledObject(objectType: string | number, object: string): void;
    getRecycledObject(objectType: string | number): string | undefined;
    removeFromPool(object: string): boolean;
    clearAll(): void;
    private _getRelevantSet;
    private _stringify;
}
